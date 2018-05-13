import * as vscode from 'vscode';
import * as path from 'path';

import PLSQLSettings from './plsql.settings';
import PlSqlParser from './plsqlParser.vscode';
import { PlSqlNavigator } from './lib/PlSqlNavigator';
import { PLSQLCursorInfos } from './lib/PlSqlNavigator';

export default class PlSqlNavigatorVSC /*extends PlSqlNavigator*/ {

    public static goto(document: vscode.TextDocument, position: vscode.Position): Promise<PLSQLSymbol> {

        PlSqlParser.initParser(PLSQLSettings.getCommentInSymbols());

        const line = document.lineAt(position),
              cursorInfos = this.getCursorInfos(document, line, position),
              parserRoot = PlSqlParser.parseDocument(document);

        return PlSqlNavigator.goto(cursorInfos, document.offsetAt(line.range.start), parserRoot,
                  this.translatePackageName.bind(this, document), this.getGlobCmdEx.bind(this, document));
    }

    public static complete(document: vscode.TextDocument, position: vscode.Position): Promise<PLSQLSymbol[]> {

        const line = document.lineAt(position),
              cursorInfos = this.getCursorInfos(document, line, position);

        if (!cursorInfos.previousWord)
            return Promise.resolve(null);

        PlSqlParser.initParser(PLSQLSettings.getCommentInSymbols());
        return PlSqlNavigator.complete(cursorInfos,
                   this.translatePackageName.bind(this, document), this.getGlobCmdEx.bind(this, document));
    }

    public static getCursorInfos(document: vscode.TextDocument, line, position: vscode.Position): PLSQLCursorInfos {

        const lineText = line.text,
              range = document.getWordRangeAtPosition(position),
              endChar = range ? range.end.character : position.character,
              currentWord = range ? document.getText(range) : '';  // 'pkg.'

        return PlSqlNavigator.getCursorInfos(currentWord, endChar, lineText);
    }

    private static translatePackageName(document, packageName: string): string {
        return PLSQLSettings.translatePackageName(packageName);
    }

    private static getGlobCmdEx(document, search) {
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

}
