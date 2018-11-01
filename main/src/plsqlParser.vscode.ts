import * as vscode from 'vscode';

import './lib/definition';
import PlSqlParser from './lib/plsqlParser';

export default class PlSqlParserVSC extends PlSqlParser {

    public static parseDocument(document: vscode.TextDocument): PLSQLRoot {
        return this.parseFile(document.fileName, document.getText());
    }

    public static parseParams(symbol: PLSQLSymbol): PLSQLParam[] {
        return PlSqlParser.parseParams(symbol);
    }

    public static getAllSymbols(document: vscode.TextDocument): vscode.DocumentSymbol[] {
        const root = this.parseFile(document.fileName, document.getText());
        return root.symbols.map(symbol => this.getSymbolInformation(document, symbol));
    }

    public static getAllDeclaration(document: vscode.TextDocument): PLSQLSymbol[] {
        const root = this.parseFile(document.fileName, document.getText());
        return PlSqlParser.getSymbolsDeclaration(root);
    }

    public static getSymbolsCompletion(symbol: PLSQLSymbol): any {
        return {
            label: symbol.name,
            documentation: this.getFormatSymbolDocumentation(symbol),
            kind: this.convertToCompletionKind(symbol.kind),
            detail: symbol.definition
        };
    }

    public static getFormatSymbolDocumentation(symbol: PLSQLSymbol): string | vscode.MarkdownString {
        if (!symbol.documentation)
            return '';

        const useJsDoc = symbol.documentation.indexOf('@') !== -1;
        PlSqlParser.formatSymbolDocumentation(symbol, useJsDoc);

        let symbolDoc: string | vscode.MarkdownString;
        if (symbol.formatedDoc.isMarkdown)
            symbolDoc = new vscode.MarkdownString(symbol.formatedDoc.text);
        else
            symbolDoc = symbol.formatedDoc.text;
        return symbolDoc;
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
