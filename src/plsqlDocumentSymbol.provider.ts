import * as vscode from 'vscode';
import PlSqlParser from './plsqlParser.vscode';

export class PLSQLDocumentSymbolProvider implements vscode.DocumentSymbolProvider {

    public provideDocumentSymbols(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.SymbolInformation[] {
        return PlSqlParser.getAllSymbols(document);
    }

}
