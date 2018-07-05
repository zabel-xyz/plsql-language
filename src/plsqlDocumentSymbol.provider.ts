import * as vscode from 'vscode';
import PlSqlParser from './plsqlParser.vscode';
import { PLSQLSettings } from './plsql.settings';

export class PLSQLDocumentSymbolProvider implements vscode.DocumentSymbolProvider {

    public provideDocumentSymbols(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.DocumentSymbol[] {
        PlSqlParser.initParser(PLSQLSettings.getCommentInSymbols());
        return PlSqlParser.getAllSymbols(document);
    }

}
