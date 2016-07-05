'use strict';

import vscode = require('vscode');
import path = require('path');
import fs = require('fs');

interface PLSQLRange {
    start: number;
    end: number;
}

interface PLSQLInfos {
    packageName: string;
    specOffset?: number;
    bodyOffset?: number;
}

export class PLSQLDefinitionProvider implements vscode.DefinitionProvider {

    private getPackageInfos(text: string): PLSQLInfos {
        let regexp = /\b((create)(\s*or\s+replace)?\s*package)(\s*body)?\s*\w*/gi,
            infos: PLSQLInfos,
            found;

        do {
            found = regexp.exec(text);
            if (found) {
                found[0] = found[0].toLowerCase();
                // last word = package name
                if (!infos)
                    infos = {packageName: found[0].split(/\s+/ig).slice(-1)[0].toLowerCase()};
                if (found[0].indexOf('body') < 0)
                    infos.specOffset = found.index;
                else
                    infos.bodyOffset = found.index;
            }
        }
        while (found);

        return infos;
    }

    private findPkgMethod(name, text: string, searchRange?: PLSQLRange): number {
        // TODO name+suffix or name ?
        let regexp = new RegExp('\\b(function|procedure)\\s*' + name, 'gi'),
            found;

        do {
            found = regexp.exec(text);
            if (found && (!searchRange || ((found.index > searchRange.start) && (found.index < searchRange.end)) ))
                return found.index;
        }
        while (found);

        return null;
    }

    private findMethod(name, text: string): number {
        // TODO name+suffix or name ?
        let regexp =  new RegExp('\\b(create)(\\s*or\\s+replace)?\\s*(function|procedure)\\s*'+name, 'gi'),
            found;

        do {
            found = regexp.exec(text);
            if (found)
                return found.index;
        }
        while (found);

        return null;
    }

    private findFile(fileName, functionName: string, isPackage?: boolean): Thenable<vscode.Location> {
        return new Promise((resolve, reject) => {
            if (!vscode.workspace)
                reject('No workspace');

            // Don't use findFiles it's case sensitive (issus ##8666)
            // vscode.workspace.findFiles('**/*'+fileName+'*.*','')
            let glob = require("glob"),
                me = this;

            // ignore like search.exclude settings
            // TODO: not do that every time
            let searchExclude = vscode.workspace.getConfiguration('search').get('exclude'),
                ignore = [];
            for (let key in searchExclude)
                if (searchExclude[key])
                    ignore.push(key);

            glob('**/*'+fileName+'*.*',
                    {nocase: true, cwd: vscode.workspace.rootPath, ignore: ignore}, (err, files) => {

                if (err || !files || !files.length) {
                    if (err)
                        reject(err)
                    else
                        resolve(null);
                    return;
                }

                // Generator is not supported by typescript yet
                files.iter = 0;
                files.next = () => {
                    if (files.iter < files.length)
                        return {done: false, value: path.join(vscode.workspace.rootPath, files[files.iter++])};
                    else
                        return {done: true, value: undefined}
                };
                // read all files
                me.readFiles(files, fileName, functionName, isPackage)
                .then (value => {
                    resolve(value)
                })
                .catch(error => {
                    resolve(null);
                })
            })
        })
    }

    private readFiles(allFiles, packageName, functionName, isPackage?: boolean) {
        return new Promise((resolve, reject) => {
            let result = allFiles.next(),
                me = this;

            // recursive function to iterate through
            function step() {

                // if there's more to do
                if (!result.done) {
                    me.readFile(result.value, packageName, functionName, isPackage)
                    .then(value => {
                        if (value) {
                            console.log(value);
                            resolve(value);
                        } else {
                            // Read next file
                            result = allFiles.next();
                            step();
                        }
                    })
                    .catch(error => {
                        reject(error);
                    });
                } else
                    resolve(null);
            };
            step();
        })
    }

    private readFile(file, packageName, functionName, isPackage?: boolean) {
        return new Promise((resolve, reject) => {
            // only want files whose ext matches .sql or .pkb
            // if (['.sql', '.pkb'].includes(path.extname(file).toLowerCase()))  // ts Error ?
            if (['.sql', '.pkb'].indexOf(path.extname(file).toLowerCase()) < 0) {
                resolve(null)
            } else {
                let me = this;
                fs.readFile(file, (err, data) => {
                    if (err)
                        reject(err);

                    let infos: PLSQLInfos,
                        offset: number,
                        text = data.toString();

                    if (isPackage) {
                        // Get infos of current package
                        infos = this.getPackageInfos(text);
                        // if it's ok, find function
                        if ((infos.bodyOffset != null) && (infos.packageName === packageName)) {
                            offset = me.findPkgMethod(functionName, text, {start: infos.bodyOffset, end: Number.MAX_VALUE});
                        } else {
                            // try with another file
                            resolve(null)
                        }
                    } else {
                        offset = me.findMethod(functionName, text);
                        if (offset == null)
                            // try with another file
                            resolve(null);
                    }

                    if (offset != null) {
                        vscode.workspace.openTextDocument(file)
                            .then(document => {
                                resolve(me.getLocation(document, offset));
                            });
                    } else {
                        // stop all search here
                        reject('function not found')
                    }
                });
            }
        });
    }

    private getLocation(document: vscode.TextDocument, offset: number): vscode.Location {
        console.log(vscode.Uri.file(document.fileName));
        return new vscode.Location(vscode.Uri.file(document.fileName), document.positionAt(offset));
    }

    public provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Thenable<vscode.Location> {
        return new Promise<vscode.Location>((resolve, reject) => {

            let line = document.lineAt(position),
                lineText = line.text,
                currentWord = document.getText(document.getWordRangeAtPosition(position)),
                documentText = document.getText(),
                infos: PLSQLInfos,
                offset: number;

            // Get infos of current package
            infos = this.getPackageInfos(documentText);

            // It's the specification or the body declaration line
            if (this.findPkgMethod(currentWord, lineText) !== null) {
                if (infos.specOffset != null && infos.bodyOffset != null) {
                    let searchRange: PLSQLRange;
                    if (document.offsetAt(line.range.start) < infos.bodyOffset)
                        searchRange = {start: infos.bodyOffset, end: Number.MAX_VALUE};
                    else
                        searchRange = {start: 0, end: infos.bodyOffset};
                    if (offset = this.findPkgMethod(currentWord, documentText, searchRange))
                        resolve(this.getLocation(document, offset))
                    else
                        resolve(null);
                } else {
                    // TODO: search in another file (spec and body are in separate files)
                    resolve(null);
                }
            } else {
                // It's a link to another function
                let regExp = new RegExp('\\b\\w+\\.'+ currentWord, 'i'),
                    found;
                if (found = regExp.exec(lineText)) {
                    let packageName = found[0].split('.', 1)[0].toLowerCase();
                    // In the same package
                    if (infos.packageName === packageName) {
                        if (offset = this.findPkgMethod(currentWord, documentText, {start: infos.bodyOffset, end: Number.MAX_VALUE}))
                            resolve(this.getLocation(document, offset));
                        else
                            resolve(null);
                    } else {
                        // In another package
                        // Search in another file (after body) with filename
                        this.findFile(packageName, currentWord, true)
                        .then (value => {
                            resolve(value);
                        })
                    }
                } else {
                    // function in the package
                    if (offset = this.findPkgMethod(currentWord, documentText, {start: infos.bodyOffset, end: Number.MAX_VALUE}))
                        resolve(this.getLocation(document, offset));
                    else {
                        // TODO ? if it's not a keyword, string, number => resolve(null)
                        // Search in another file and it's not a package ! (perhaps a function or a method)
                        this.findFile(currentWord, currentWord)
                        .then (value => {
                            resolve(value);
                        })
                    }
                }
            }
        })
    }
}