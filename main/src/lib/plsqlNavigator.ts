import './definition';
import PlSqlParser from './plsqlParser';

import * as iconv from 'iconv-lite';
import * as path from 'path';
import * as fs from 'fs';

export interface PLSQLCursorInfos {
    previousWord: string;
    currentWord: string;
    previousDot: boolean;
}

export class PlSqlNavigator {

    private static useEncoding = 'utf8';

    public static setEncoding(encoding: string) {
        this.useEncoding = encoding;
    }

    public static goto(
        cursorInfos: PLSQLCursorInfos,
        lineOffset: number,
        parserRoot: PLSQLRoot,
        pkgGetName_cb: ((name: string) => string) | undefined,
        search_cb: (search: any) => any,
        findSpec?: boolean
    ): Promise<PLSQLSymbol | null> {
        return new Promise<PLSQLSymbol | null>((resolve, reject) => {
            let cursorSymbol: PLSQLSymbol | undefined = undefined;
            let rootSymbol: PLSQLSymbol | undefined = undefined;
            let rootSymbol2: PLSQLSymbol | undefined = undefined;
            let navigateSymbol: PLSQLSymbol | undefined = undefined;
            let navigateSymbol2: PLSQLSymbol | undefined = undefined;
            let isDeclaration = false;
            let packageName = '';

            // Declaration
            if (this.isPackageDeclaration(cursorInfos.previousWord)) {
                isDeclaration = true;
                cursorSymbol = PlSqlParser.findSymbolByNameOffset(
                    parserRoot.symbols, cursorInfos.currentWord, lineOffset);

                if (cursorSymbol && cursorSymbol.parent) {
                    if (
                        findSpec &&
                        ((cursorSymbol.parent.kind === PLSQLSymbolKind.packageSpec) ||
                            [PLSQLSymbolKind.procedureSpec, PLSQLSymbolKind.functionSpec].includes(cursorSymbol.kind))
                    ) {
                        return resolve(null);
                    }
                    // switch in body (spec and body are in body)
                    if (cursorSymbol.parent.kind !== PLSQLSymbolKind.packageSpec) {
                        if (cursorSymbol.parent.symbols) {
                            navigateSymbol = PlSqlParser.findSymbolByNameKind(
                                cursorSymbol.parent.symbols,
                                cursorSymbol.name,
                                PlSqlParser.switchSymbolKind(cursorSymbol.kind),
                                false
                            );
                    if (navigateSymbol !== undefined && navigateSymbol !== null) {
                        return resolve(navigateSymbol);
                    } else {
                        return resolve(null);
                    }
                        }
                    }
                    // switch body <-> spec
                    rootSymbol = PlSqlParser.switchSymbol(cursorSymbol.parent);
                    if (rootSymbol && rootSymbol !== cursorSymbol.parent) {
                        if (rootSymbol.symbols) {
                            navigateSymbol = PlSqlParser.findSymbolByNameKind(
                                rootSymbol.symbols,
                                cursorSymbol.name,
                                PlSqlParser.switchSymbolKind(cursorSymbol.kind),
                                false
                            );
                            if (navigateSymbol !== undefined && navigateSymbol !== null) {
                                return resolve(navigateSymbol);
                            } else {
                                return resolve(null);
                            }
                        }
                    } else if (rootSymbol === cursorSymbol.parent) {
                        return resolve(null); // No navigation here we are not in a package
                    } else {
                        // search in another file (spec && body are in separate files)
                        packageName = cursorSymbol.parent.name;
                    }
                } else {
                    // No parent => a function or a procedure not in a package
                    return resolve(null);
                }
            } else {
                // Call
                rootSymbol = PlSqlParser.findSymbolNearOffset(parserRoot.symbols, lineOffset, false);
                if (rootSymbol && rootSymbol.kind === PLSQLSymbolKind.packageSpec) {
                    return resolve(null); // No navigation here we are in a spec
                }
                packageName = cursorInfos.previousDot ? cursorInfos.previousWord : '';
                // Use synonyme for package
                if (pkgGetName_cb) packageName = pkgGetName_cb.call(this, packageName);
                // Search in current file
                if (
                    rootSymbol &&
                    (!packageName || (packageName.toLowerCase() === rootSymbol.name.toLowerCase()))
                ) {
                    if (rootSymbol.symbols) {
                        navigateSymbol = PlSqlParser.findSymbolByNameOffset(
                            rootSymbol.symbols,
                            cursorInfos.currentWord,
                            0,
                            true
                        );
                        if (navigateSymbol) {
                            if (
                                (!findSpec && PlSqlParser.isSymbolSpec(navigateSymbol)) ||
                                (findSpec && !PlSqlParser.isSymbolSpec(navigateSymbol))
                            ) {
                                if (rootSymbol.symbols) {
                                    navigateSymbol2 = PlSqlParser.findSymbolByNameKind(
                                        rootSymbol.symbols,
                                        navigateSymbol.name,
                                        PlSqlParser.switchSymbolKind(navigateSymbol.kind),
                                        false
                                    );
                                }
                            }
                            if (!findSpec) {
                                return resolve(navigateSymbol2 ?? navigateSymbol);
                            } else {
                                navigateSymbol = navigateSymbol2 ?? navigateSymbol;
                            }
                        }
                    }
                    // Search in current spec (maybe a constant or type definition)
                    rootSymbol2 = PlSqlParser.switchSymbol(rootSymbol);
                    if (rootSymbol2 && rootSymbol2 !== rootSymbol && rootSymbol2.symbols) {
                        navigateSymbol =
                            PlSqlParser.findSymbolByNameOffset(
                                rootSymbol2.symbols,
                                cursorInfos.currentWord,
                                0,
                                false
                            ) || navigateSymbol;
                        if (navigateSymbol) return resolve(navigateSymbol);
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
                isDeclaration: isDeclaration,
                priority: isDeclaration ? null : (findSpec ? PLSQLSymbolKind.packageSpec : PLSQLSymbolKind.packageBody),
            };
            this.searchExternal(search, search_cb, this.gotoFile)
                .then((symbol: PLSQLSymbol | null) => resolve(symbol))
                .catch((err: unknown) => reject(err));
        });
    }

    public static getCursorInfos(currentWord: string, endOffset: number, line: string): PLSQLCursorInfos {

        let previousWord: string = '',
            previousDot = false;
        let safeCurrentWord: string = currentWord;

        if (this.isPackageDeclaration(currentWord)) {
            const regexp = new RegExp(/(?:^\s+)?([\w\$#]+)/i);
            const found = regexp.exec(line.substr(endOffset));
            if (found) {
                previousWord = currentWord;
                safeCurrentWord = found[1];
            }
        } else {
            const regexp = new RegExp(`([\\w\\$#]+)(\\s+|.)(\")?${currentWord.replace(/[\\$#]/g, '\\$&')}(\")?$`);
            const found = regexp.exec(line.substr(0, endOffset));
            if (found) {
                previousWord = found[1];
                previousDot = found[2] === '.';
                if (found[3] || found[4])
                    safeCurrentWord = `"${currentWord}"`;
            }
        }
        return {
            previousWord,
            currentWord: safeCurrentWord,
            previousDot
        };
    }

    public static complete(
        cursorInfos: PLSQLCursorInfos,
        search_cb: (search: any) => any
    ): Promise<PLSQLSymbol[]> {
        return new Promise<PLSQLSymbol[]>((resolve, reject) => {
            const search = {
                package: cursorInfos.previousWord,
                cursorWord: cursorInfos.currentWord,
                mode: 'complete'
            };
            this.searchExternal(search, search_cb, this.completeItem)
                .then((symbols: PLSQLSymbol[]) => resolve(symbols))
                .catch((err: unknown) => reject(err));
        });
    }

    private static isPackageDeclaration(text: string): boolean {
        return !!text && ['function', 'procedure'].includes(text.toLowerCase());
    }

    private static async searchExternal(
        search: any,
        search_cb: (search: any) => any,
        parseFn: (...args: any[]) => any
    ): Promise<any> {
        const globCmd = this.getGlobCmd(search, search_cb);
        for (let searchFld of globCmd.searchFld) {
            globCmd.params.cwd = searchFld;
            const resultSearch = await this.searchExternalGlob(globCmd, { ...search }, parseFn);
            if (resultSearch) return resultSearch;
            // else continue with next globSearch
        }
        return null;
    }

    private static searchExternalGlob(
        globCmd: any,
        search: any,
        parseFn: (...args: any[]) => any
    ): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            let files: string[] = [];
            this.getGlobFiles(globCmd)
                .then((globFiles: string[]) => {
                    files = globFiles;
                    return this.parseFiles(files, search, parseFn);
                })
                .then((symbol: any) => {
                    // search without packageName (because it's perhaps only the name of the schema)
                    if (!symbol && search.package && search.mode !== 'complete') {
                        search.package = null;
                        return this.parseFiles(files, search, parseFn);
                    }
                    return symbol;
                })
                .then((symbol: any) => {
                    resolve(symbol);
                })
                .catch((err: unknown) => {
                    reject(err);
                });
        });
    }

    private static getGlobFiles(globCmd: any): Promise<string[]> {
        const glob = require('glob');
        return new Promise((resolve, reject) => {
            if (!globCmd.params.cwd) return reject('No current directory for glob search !');
            glob(globCmd.glob, globCmd.params, (err: any, files: string[]) => {
                if (err) return reject(err);
                return resolve(
                    files
                        .map((file: string) => path.join(globCmd.params.cwd, file))
                        .filter(
                            (file: string) =>
                                file !== globCmd.current &&
                                globCmd.ext.includes(path.extname(file).toLowerCase().substr(1))
                        )
                );
            });
        });
    }

    private static getGlobCmd(searchTexts: { package?: string; cursorWord?: string }, cb: (search: any) => any): any {
        let files: string[] = [];
        if (searchTexts.package) files.push(searchTexts.package);
        if (searchTexts.cursorWord) files.push(searchTexts.cursorWord);
        let search: any = {
            files: files,
            glob: undefined,
            ext: ['sql', 'ddl', 'dml', 'pkh', 'pks', 'pkb', 'pck', 'pls', 'plb'],
            params: {
                nocase: true,
            },
        };
        search = cb.call(this, search);
        let searchTxt: string = '';
        if (search.files.length > 1) searchTxt = `{${search.files.join(',')}}`;
        else searchTxt = search.files[0];
        // search.glob = `**/*${searchTxt}*.{${search.ext.join(',')}}`;
        search.glob = `**/*${searchTxt}*.*`; // filter on extension is made after => faster
        return search;
    }

    private static parseFiles(
        files: string[],
        searchInfos: any,
        func: (...args: any[]) => any
    ): Promise<any> {
        return new Promise((resolve, reject) => {
            const me = this;
            let latestSymbol: PLSQLSymbol | undefined = undefined;
            (function process(index: number) {
                if (index >= files.length) {
                    return resolve(null);
                }
                me.readFile(files[index])
                    .then((rootSymbol: PLSQLRoot) => {
                        const navigateSymbol = func.call(me, searchInfos, rootSymbol);
                        if (navigateSymbol && navigateSymbol.continue) {
                            latestSymbol = navigateSymbol.symbol;
                            process(index + 1);
                        } else {
                            resolve(navigateSymbol ? navigateSymbol.symbol || latestSymbol : latestSymbol ?? null);
                        }
                    })
                    .catch((errParse: unknown) => {
                        // an error with this file
                        reject(errParse);
                    });
            })(0);
        });
    }

    private static completeItem(searchInfos: any, rootSymbol: PLSQLRoot): any {
        // TODO: return current package body private func/proc/spec
        const parentSymbol = rootSymbol.symbols
            ? PlSqlParser.findSymbolByNameKind(rootSymbol.symbols, searchInfos.package, [PLSQLSymbolKind.packageSpec], false)
            : undefined;
        if (parentSymbol && parentSymbol.symbols) {
            return { symbol: parentSymbol.symbols };
        } else {
            return { continue: true };
        }
    }

    private static gotoFile(searchInfos: any, rootSymbol: PLSQLRoot): any {
        let parentSymbol: PLSQLSymbol | undefined = undefined;
        let navigateSymbol: PLSQLSymbol | undefined = undefined;
        let symbols: PLSQLSymbol[] | undefined = undefined;
        if (searchInfos.package) {
            parentSymbol = rootSymbol.symbols
                ? PlSqlParser.findSymbolByNameKind(
                      rootSymbol.symbols,
                      searchInfos.package,
                      [PLSQLSymbolKind.packageSpec, PLSQLSymbolKind.packageBody],
                      false
                  )
                : undefined;
            if (parentSymbol && parentSymbol.symbols) {
                symbols = parentSymbol.symbols;
            }
            // else continue search, package is not in this file
        } else if (rootSymbol.symbols) {
            symbols = rootSymbol.symbols;
        }
        if (symbols) {
            navigateSymbol = PlSqlParser.findSymbolByNameOffset(symbols, searchInfos.cursorWord, 0, false);
            if (navigateSymbol) {
                if (
                    navigateSymbol.parent &&
                    ((searchInfos.priority === PLSQLSymbolKind.packageSpec &&
                        navigateSymbol.parent.kind === PLSQLSymbolKind.packageBody &&
                        [PLSQLSymbolKind.function, PLSQLSymbolKind.procedure].includes(navigateSymbol.kind)) ||
                        (searchInfos.priority === PLSQLSymbolKind.packageBody &&
                            navigateSymbol.parent.kind === PLSQLSymbolKind.packageSpec &&
                            [PLSQLSymbolKind.functionSpec, PLSQLSymbolKind.procedureSpec].includes(navigateSymbol.kind)))
                ) {
                    parentSymbol = PlSqlParser.switchSymbol(navigateSymbol.parent);
                    if (parentSymbol && parentSymbol !== navigateSymbol.parent && parentSymbol.symbols) {
                        return {
                            symbol:
                                PlSqlParser.findSymbolByNameOffset(
                                    parentSymbol.symbols,
                                    searchInfos.cursorWord,
                                    0,
                                    false
                                ) || navigateSymbol,
                        };
                    } else {
                        return { symbol: navigateSymbol, continue: true };
                    }
                } else {
                    return { symbol: navigateSymbol };
                }
            }
        }
        return { continue: true };
    }

    private static readFile(file: string): Promise<PLSQLRoot> {
        return new Promise((resolve, reject) => {
            fs.readFile(file, (err, data) => {
                if (err)
                    return reject(err);

                let dataS = '';
                if (this.useEncoding === 'utf8')
                    dataS = data.toString();
                else
                    dataS = iconv.decode(data, this.useEncoding);

                return resolve(PlSqlParser.parseFile(file, dataS));
            });
        });
    }
}
