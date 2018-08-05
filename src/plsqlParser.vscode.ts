import * as vscode from 'vscode';

import PlSqlParser from './lib/plsqlParser';

export default class PlSqlParserVSC extends PlSqlParser {

    public static parseDocument(document: vscode.TextDocument): PLSQLRoot {
        return this.parseFile(document.fileName, document.getText());
    }

    public static getAllSymbols(document: vscode.TextDocument): vscode.DocumentSymbol[] {
        const root = this.parseFile(document.fileName, document.getText());
        return root.symbols.map(symbol => this.getSymbolInformation(document, symbol));
    }

    public static getSymbolsCompletion(symbol: PLSQLSymbol): any {
        return {
            label: symbol.name,
            kind: this.convertToCompletionKind(symbol.kind)
        };
    }

    private static getSymbolInformation(document: vscode.TextDocument, symbol: PLSQLSymbol) {
        const line = symbol.offset != null ? document.lineAt(document.positionAt(symbol.offset)) : document.lineAt(0)/*document.lineAt(symbol.line)*/;
        const lineEnd = symbol.offsetEnd != null ? document.lineAt(document.positionAt(symbol.offsetEnd)) : line;

        const result = new vscode.DocumentSymbol(
            symbol.kindName+' '+symbol.name,
            '',
            this.convertToSymbolKind(symbol.kind),
            // symbol.parent ? symbol.parent.kindName+' '+symbol.parent.name : '',
            // new vscode.Location(document.uri, new vscode.Range(line.range.start, line.range.end))
            new vscode.Range(line.range.start, lineEnd.range.end),
            new vscode.Range(line.range.start, lineEnd.range.end)
        );
        if (symbol.symbols)
            result.children = symbol.symbols.map(item => this.getSymbolInformation(document, item));

        return result;
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

    private static convertToCompletionKind(kind: PLSQLSymbolKind): vscode.CompletionItemKind {
        switch (kind) {
            case PLSQLSymbolKind.packageSpec:
                return vscode.CompletionItemKind.Unit; // Package;
            case PLSQLSymbolKind.packageBody:
                return vscode.CompletionItemKind.Unit; // Package;
            case PLSQLSymbolKind.function:
                return vscode.CompletionItemKind.Function;
            case PLSQLSymbolKind.functionSpec:
                return vscode.CompletionItemKind.Function;
                // return vscode.CompletionItemKind.Interface;
            case PLSQLSymbolKind.procedure:
                return vscode.CompletionItemKind.Method;
            case PLSQLSymbolKind.procedureSpec:
                return vscode.CompletionItemKind.Method;
                // return vscode.CompletionItemKind.Interface;
            case PLSQLSymbolKind.variable:
                return vscode.CompletionItemKind.Variable;
            case PLSQLSymbolKind.constant:
                return vscode.CompletionItemKind.Constant;
            case PLSQLSymbolKind.type:
            case PLSQLSymbolKind.subtype:
            case PLSQLSymbolKind.cursor:
            case PLSQLSymbolKind.exception:
                return vscode.CompletionItemKind.Struct;
        }
    }

}
