import * as vscode from 'vscode';
import * as path from 'path';

import PLSQLSettings from './plsql.settings';
import PlSqlParser from './plsqlParser.vscode';
import { PlSqlNavigator } from './lib/PlSqlNavigator';
import { PLSQLCursorInfos } from './lib/PlSqlNavigator';

export class PLSQLDefinitionProvider implements vscode.DefinitionProvider {

    public provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Thenable<vscode.Location> {

        return new Promise<vscode.Location>((resolve, reject) => {

            PlSqlParser.initParser(PLSQLSettings.getCommentInSymbols());

            const line = document.lineAt(position),
                  cursorInfos = this.getCursorInfos(document, line, position),
                  parserRoot = PlSqlParser.parseDocument(document);

            PlSqlNavigator.goto(cursorInfos, document.offsetAt(line.range.start), parserRoot,
                    this.translatePackageName.bind(this, document), this.getGlobCmdEx.bind(this, document))
                .then(symbol => {
                    return this.getFileLocation(symbol);
                })
                .then(location => {
                    return resolve(location);
                })
                .catch(err => {
                    reject(err);
                });
        });
    };

    private getCursorInfos(document: vscode.TextDocument, line, position: vscode.Position): PLSQLCursorInfos {

        const lineText = line.text,
              range = document.getWordRangeAtPosition(position),
              currentWord = document.getText(range);

        return PlSqlNavigator.getCursorInfos(currentWord, range.end.character, lineText);
    }

    private translatePackageName(document, packageName: string): string {
        return PLSQLSettings.translatePackageName(packageName);
    }

    private getGlobCmdEx(document, search) {
        const {cwd, ignore} = PLSQLSettings.getSearchInfos(document.uri);
        // Ignore current file
        ignore.push(path.relative(cwd, document.uri.fsPath));

        return {
            files: search.files,
            ext: PLSQLSettings.getSearchExt(search.ext),
            params: {
                nocase: true,
                cwd: cwd,
                ignore: ignore
            }
        };
    }

    private getFileLocation(navigateSymbol: PLSQLSymbol): Promise<vscode.Location> {
        return new Promise((resolve, reject) => {
            if (navigateSymbol)
                vscode.workspace.openTextDocument(PlSqlParser.getSymbolFileName(navigateSymbol))
                    .then(document => {
                        resolve(this.getLocation(document, navigateSymbol));
                    });
            else
                resolve();
        });
    }

    private getLocation(document: vscode.TextDocument, navigateSymbol: PLSQLSymbol): vscode.Location {
        if (navigateSymbol)
            return new vscode.Location(vscode.Uri.file(document.fileName), document.positionAt(navigateSymbol.offset));
        else
            return null;
    }

}
