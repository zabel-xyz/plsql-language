import * as vscode from 'vscode';
import PlSqlParser from './lib/PlSqlParser';

export default class PlSqlParserVSC extends PlSqlParser {

    public static parseDocument(document: vscode.TextDocument): PLSQLRoot {
        return this.parseFile(document.fileName, document.getText());
    }

    public static getAllSymbols(document: vscode.TextDocument): vscode.SymbolInformation[] {
        return this.getSymbols(document.fileName, document.getText()).map(symbol =>
            this.getSymbolInformation(document, symbol)
        );
    }

    private static getSymbolInformation(document: vscode.TextDocument, symbol: PLSQLSymbol) {
        const line = symbol.offset != null ? document.lineAt(document.positionAt(symbol.offset)) : document.lineAt(symbol.line);

        return new vscode.SymbolInformation(
            symbol.kindName+' '+symbol.name,
            this.convertToSymbolKind(symbol.kind),
            new vscode.Range(line.range.start, line.range.end)
        );
    }

    private static convertToSymbolKind(kind: PLSQLSymbolKind): vscode.SymbolKind {
        switch (kind) {
            case PLSQLSymbolKind.packageSpec:
                return vscode.SymbolKind.Package;
            case PLSQLSymbolKind.packageBody:
                return vscode.SymbolKind.Package;
            case PLSQLSymbolKind.function:
                return vscode.SymbolKind.Function;
            case PLSQLSymbolKind.functionSpec:
                // return vscode.SymbolKind.Function;
                return vscode.SymbolKind.Interface;
            case PLSQLSymbolKind.procedure:
                return vscode.SymbolKind.Method;
            case PLSQLSymbolKind.procedureSpec:
                // return vscode.SymbolKind.Method;
                return vscode.SymbolKind.Interface;
            case PLSQLSymbolKind.variable:
                return vscode.SymbolKind.Variable;
            case PLSQLSymbolKind.constant:
                return vscode.SymbolKind.Constant;
            case PLSQLSymbolKind.type:
            case PLSQLSymbolKind.subtype:
            case PLSQLSymbolKind.cursor:
            case PLSQLSymbolKind.exception:
                return vscode.SymbolKind.Struct;
        }
    }
}
