import * as vscode from 'vscode';
import * as path from 'path';

import { PLSQLSettings } from './plsql.settings';
import PlSqlParser from './plsqlParser.vscode';
import { PlSqlNavigator } from './lib/plsqlNavigator';
import { PLSQLCursorInfos } from './lib/plsqlNavigator';


export interface PLSQLCursorInfosVSC extends PLSQLCursorInfos {
    line: vscode.TextLine;
}

export class PlSqlNavigatorVSC /*extends PlSqlNavigator*/ {

    public static goto(document: vscode.TextDocument, position: vscode.Position): Promise<PLSQLSymbol> {

        PlSqlParser.initParser(PLSQLSettings.getCommentInSymbols());

        const cursorInfos = this.getCursorInfos(document, position),
              parserRoot = PlSqlParser.parseDocument(document);

        return PlSqlNavigator.goto(cursorInfos, document.offsetAt(cursorInfos.line.range.start), parserRoot,
                  this.translatePackageName.bind(this, document), this.getGlobCmdEx.bind(this, document));
    }

    public static complete(document: vscode.TextDocument, position: vscode.Position, cursorInfos: PLSQLCursorInfos): Promise<PLSQLSymbol[]> {

        if (!cursorInfos.previousWord)
            return Promise.resolve(null);

        PlSqlParser.initParser(PLSQLSettings.getCommentInSymbols());
        return PlSqlNavigator.complete(cursorInfos,
                   this.translatePackageName.bind(this, document), this.getGlobCmdEx.bind(this, document));
    }

    public static getCursorInfos(document: vscode.TextDocument, position: vscode.Position): PLSQLCursorInfosVSC {

        const line = document.lineAt(position),
              lineText = line.text,
              range = document.getWordRangeAtPosition(position),
              endChar = range ? range.end.character : position.character,
              currentWord = range ? document.getText(range) : '',  // 'pkg.'
              cursorInfo = PlSqlNavigator.getCursorInfos(currentWord, endChar, lineText);

        return { ...cursorInfo, line};
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
