import PlSqlParser from './plsqlParser';

import * as path from 'path';
import * as fs from 'fs';

export interface PLSQLCursorInfos {
    previousWord: string;
    currentWord: string;
    previousDot: boolean;
}

export class PlSqlNavigator {

    public static goto(cursorInfos: PLSQLCursorInfos, lineOffset: number, parserRoot: PLSQLRoot, pkgGetName_cb, search_cb): Promise<PLSQLSymbol> {

        return new Promise<PLSQLSymbol>((resolve, reject) => {

            let cursorSymbol: PLSQLSymbol,
                rootSymbol: PLSQLSymbol,
                rootSymbol2: PLSQLSymbol,
                navigateSymbol: PLSQLSymbol,
                navigateSymbol2: PLSQLSymbol,
                isDeclaration: boolean,
                packageName: string;

            // Declaration
            if (/*!cursorInfos.previousDot &&*/ this.isPackageDeclaration(cursorInfos.previousWord)) {
                isDeclaration = true;
                cursorSymbol = PlSqlParser.findSymbolByNameOffset(
                    parserRoot.symbols, cursorInfos.currentWord, lineOffset);

                if (cursorSymbol && cursorSymbol.parent) {

                    // switch in body (spec and body are in body)
                    if (cursorSymbol.parent.kind !== PLSQLSymbolKind.packageSpec) {
                        navigateSymbol = PlSqlParser.findSymbolByNameKind(cursorSymbol.parent.symbols, cursorSymbol.name, PlSqlParser.switchSymbolKind(cursorSymbol.kind), false);
                        if (navigateSymbol)
                            return resolve(navigateSymbol);
                    }

                    // switch body <-> spec
                    rootSymbol = PlSqlParser.switchSymbol(cursorSymbol.parent);
                    if (rootSymbol && rootSymbol !== cursorSymbol.parent) {
                        navigateSymbol = PlSqlParser.findSymbolByNameKind(rootSymbol.symbols, cursorSymbol.name, PlSqlParser.switchSymbolKind(cursorSymbol.kind), false);
                        return resolve(navigateSymbol);
                    } else if (rootSymbol === cursorSymbol.parent)
                        return resolve(); // No navigation here we are not in a package
                    else
                        // search in another file (spec && body are in separate files)
                        packageName = cursorSymbol.parent.name;
                } else
                    // No parent => a function or a procedure not in a package
                    return resolve();

            // Call
            } else {
                // Body => Body or Spec
                rootSymbol = PlSqlParser.findSymbolNearOffset(parserRoot.symbols, lineOffset, false);
                if (rootSymbol && rootSymbol.kind === PLSQLSymbolKind.packageSpec)
                    return resolve(); // No navigation here we are in a spec

                packageName = cursorInfos.previousDot ? cursorInfos.previousWord : '';
                // Use synonyme for package
                if (pkgGetName_cb)
                    packageName = pkgGetName_cb.call(this, packageName);

                // Search in current file
                if (rootSymbol && (!packageName || (packageName.toLowerCase() === rootSymbol.name.toLowerCase()))) {
                    // Search in current body of file  (recursive for subFunctions or subProcedure)
                    navigateSymbol = PlSqlParser.findSymbolByNameOffset(rootSymbol.symbols, cursorInfos.currentWord, 0, true);
                    if (navigateSymbol) {
                        if (PlSqlParser.isSymbolSpec(navigateSymbol))
                            navigateSymbol2 = PlSqlParser.findSymbolByNameKind(rootSymbol.symbols, navigateSymbol.name, PlSqlParser.switchSymbolKind(navigateSymbol.kind), false);
                        return resolve(navigateSymbol2 || navigateSymbol);
                    }
                    // Search in current spec (maybe a constant or type definition)
                    rootSymbol2 = PlSqlParser.switchSymbol(rootSymbol);
                    if (rootSymbol2 && rootSymbol2 !== rootSymbol) {
                        navigateSymbol = PlSqlParser.findSymbolByNameOffset(rootSymbol2.symbols, cursorInfos.currentWord, 0, false);
                        if (navigateSymbol)
                           return resolve(navigateSymbol);
                    } else if (!packageName && !rootSymbol2 && rootSymbol.kind === PLSQLSymbolKind.packageBody) {
                        // spec is in separate file
                        packageName = rootSymbol.name;
                    }
                }
            }

            // Search in external files
            const search = {
                package: packageName,
                cursorWord: cursorInfos.currentWord,
                isDeclaration: isDeclaration
            };
            let files;
            this.getGlobFiles(this.getGlobCmd(search, search_cb))
                .then(globFiles => {
                    files = globFiles;
                    return this.parseFiles(files, search);
                })
               .then(symbol => {
                    // search without packageName (because it's perhaps only the name of the schema)
                    if (!symbol && search.package) {
                        search.package = null;
                        return this.parseFiles(files, search);
                    }
                    return symbol;
                })
                .then(symbol => {
                    resolve(symbol);
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    public static getCursorInfos(currentWord: string, endOffset: number, line: string): PLSQLCursorInfos {

        let previousWord = null,
            previousDot = false;

        if (this.isPackageDeclaration(currentWord)) {
            const regexp = new RegExp(/(?:^\s+)?(\w+)/i);
            const found = regexp.exec(line.substr(endOffset));
            if (found) {
                previousWord = currentWord;
                currentWord = found[1];
            } else
                currentWord = null;
        } else {
            const regexp = new RegExp(`(?:(\\w+)\\s+${currentWord})|(?:(\\w+)(\\.)${currentWord})`, 'i');
            const found = regexp.exec(line.substr(0, endOffset));
            if (found) {
                previousWord = found[1] || found[2];
                previousDot = found[3] != null;
            }
        }
        return {
            previousWord,
            currentWord,
            previousDot
        };
    }

    private static isPackageDeclaration(text) {
        return text && ['function', 'procedure'].includes(text.toLowerCase());
    }

    private static getGlobFiles(globCmd): Promise<string[]> {
        const glob = require('glob');

        return new Promise((resolve, reject) => {

            glob(globCmd.glob, globCmd.params, (err, files) => {
                if (err)
                    reject(err);
                resolve(files.map(file => path.join(globCmd.params.cwd, file)));
            });
        });
    }

    private static getGlobCmd(searchTexts, cb) {

        let files: string[] = [];
        if (searchTexts.package)
            files.push(searchTexts.package);
        files.push(searchTexts.cursorWord);

        let search = {
            files: files,
            glob: undefined,
            ext: ['sql','pls','pck','pkh','pks','pkb'],
            params: {
                nocase: true
            }
        };

        search = cb.call(this, search);

        let searchTxt;
        if (search.files.length > 1)
            searchTxt = `{${search.files.join(',')}}`;
        else
            searchTxt = search.files[0];
        search.glob = `**/*${searchTxt}*.{${search.ext.join(',')}}`;

        return search;
    }

    private static parseFiles(files: string[], searchInfos): Promise<PLSQLSymbol> {

        return new Promise((resolve, reject) => {

            const me = this;

            (function process(index) {
                if (index >= files.length) {
                    return resolve();
                }

                me.readFile(files[index])
                    .then(rootSymbol => {
                        const navigateSymbol = me.gotoFile(searchInfos, rootSymbol);

                        if (navigateSymbol === null)
                            process(index + 1);
                        else
                            resolve(navigateSymbol);
                    })
                    .catch(errParse => {
                        // an error with this file
                        reject(errParse);
                    });

            })(0);

        });
    }

    private static gotoFile(searchInfos, rootSymbol: PLSQLRoot): PLSQLSymbol {
        let parentSymbol, navigateSymbol,
            symbols: PLSQLSymbol[];

        if (searchInfos.package) {
            parentSymbol = PlSqlParser.findSymbolByNameKind(rootSymbol.symbols, searchInfos.package, [PLSQLSymbolKind.packageSpec, PLSQLSymbolKind.packageBody], false);
            if (parentSymbol)
                symbols = parentSymbol.symbols;
            // else continue search, package is not in this file
        } else
            symbols = rootSymbol.symbols;

        if (symbols) {
            navigateSymbol = PlSqlParser.findSymbolByNameOffset(symbols, searchInfos.cursorWord, 0, false);
            if (navigateSymbol) {
                // if function/procedure in spec => search in body
                if (!searchInfos.isDeclaration && navigateSymbol.parent && navigateSymbol.parent.kind === PLSQLSymbolKind.packageSpec &&
                    [PLSQLSymbolKind.functionSpec, PLSQLSymbolKind.procedureSpec].includes(navigateSymbol.kind)) {
                    parentSymbol = PlSqlParser.switchSymbol(navigateSymbol.parent);
                    if (parentSymbol !== navigateSymbol.parent)
                        return PlSqlParser.findSymbolByNameOffset(parentSymbol.symbols, searchInfos.cursorWord, 0, false);
                    // else continue search, body is in a different file than spec
                } else
                    return navigateSymbol;
            }
        }
        return null; // if we must continue return null else undefined
    }

    private static readFile(file: string): Promise<PLSQLRoot> {
        return new Promise((resolve, reject) => {
            fs.readFile(file, (err, data) => {
                if (err)
                    return reject(err);
                return resolve(PlSqlParser.parseFile(file, data.toString()));
            });
        });
    }
}
