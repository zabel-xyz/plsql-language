import * as vscode from 'vscode';

import { PLSQLSettings } from './plsql.settings';
import PlSqlParser from './plsqlParser.vscode';
import { PlSqlNavigator } from './lib/plsqlNavigator';
import { PLSQLCursorInfos } from './lib/plsqlNavigator';


export interface PLSQLCursorInfosVSC extends PLSQLCursorInfos {
    line: vscode.TextLine;
}

export class PlSqlNavigatorVSC /*extends PlSqlNavigator*/ {

    public static goto(document: vscode.TextDocument, position: vscode.Position): Promise<PLSQLSymbol | null> {

        PlSqlParser.initParser(PLSQLSettings.getCommentInSymbols());

        const cursorInfos = this.getCursorInfos(document, position),
              parserRoot = PlSqlParser.parseDocument(document);

        PlSqlNavigator.setEncoding(PLSQLSettings.getEncoding(document.uri));
        return PlSqlNavigator.goto(cursorInfos, document.offsetAt(cursorInfos.line.range.start), parserRoot,
                  this.translatePackageName.bind(this, document), this.getGlobCmdEx.bind(this, document));
    }

    public static getDeclaration(document: vscode.TextDocument, position: vscode.Position): Promise<PLSQLSymbol | null> {

        PlSqlParser.initParser(PLSQLSettings.getCommentInSymbols());

        const cursorInfos = this.getCursorInfos(document, position),
              parserRoot = PlSqlParser.parseDocument(document);

        PlSqlNavigator.setEncoding(PLSQLSettings.getEncoding(document.uri));
        return PlSqlNavigator.goto(cursorInfos, document.offsetAt(cursorInfos.line.range.start), parserRoot,
                  this.translatePackageName.bind(this, document), this.getGlobCmdEx.bind(this, document), true);
    }

    public static complete(document: vscode.TextDocument, _position: vscode.Position, cursorInfos: PLSQLCursorInfos): Promise<PLSQLSymbol[]> {

        if (!cursorInfos.previousWord)
            return Promise.resolve([]);

        PlSqlParser.initParser(PLSQLSettings.getCommentInSymbols());
        PlSqlNavigator.setEncoding(PLSQLSettings.getEncoding(document.uri));
        return PlSqlNavigator.complete(cursorInfos,
                   this.getGlobCmdEx.bind(this, document));
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

    private static translatePackageName(_document: vscode.TextDocument, packageName: string): string {
        return PLSQLSettings.translatePackageName(packageName);
    }

    private static getGlobCmdEx(document: vscode.TextDocument, search: any): any {

        const {searchFld, ignore} = PLSQLSettings.getSearchInfos(document.uri);

        return {
            files: search.files,
            ext: PLSQLSettings.getSearchExt(search.ext),
            searchFld: searchFld,
            current: document.uri.fsPath,
            params: {
                nocase: true,
                ignore: ignore
            }
        };
    }

}
