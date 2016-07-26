'use strict';

import vscode = require('vscode');

export class PLSQLDocumentSymbolProvider implements vscode.DocumentSymbolProvider {

    public provideDocumentSymbols(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.SymbolInformation[] {

        let regexp = /\b(function|procedure|((create)(\s*or\s+replace)?\s*package)(\s*body)?)\s*\w*/gi,
            symbols: vscode.SymbolInformation[] = [],
            text = document.getText(),
            found;

        do {
            found = regexp.exec(text);
            if (found) {

                let line = document.lineAt(document.positionAt(found.index));
                let symbolInfo = new vscode.SymbolInformation(
                    found[0],
                    this.getSymbolKind(found[0].toLowerCase()),
                    new vscode.Range(line.range.start, line.range.end));
                symbols.push(symbolInfo);
            }
        }
        while (found);

        return symbols;
    }

    private getSymbolKind(text: string): vscode.SymbolKind {

        if (text.startsWith('function'))
            return vscode.SymbolKind.Function;
        else if (text.startsWith('procedure'))
            return vscode.SymbolKind.Method;
        else
            return vscode.SymbolKind.Package; // Specification or Body
    }
}
