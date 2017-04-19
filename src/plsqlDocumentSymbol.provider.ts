import * as vscode from 'vscode';

export class PLSQLDocumentSymbolProvider implements vscode.DocumentSymbolProvider {

    public provideDocumentSymbols(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.SymbolInformation[] {
        const regComment = `(\\/\\*[\\s\\S]*?\\*\\/)|(--.*)`;
        const regFind = `${regComment}|(?:create(?:\\s+or\\s+replace)?\\s+)?((function|procedure|package(?:\\s+body)?)\\s+(?:\\w+\\.)?\\w+)`;
        const regexp = new RegExp(regFind, 'gi');

        const symbols: vscode.SymbolInformation[] = [],
              text = document.getText();

        let found;
        while (found = regexp.exec(text)) {
            if (found[3]) {
                let line = document.lineAt(document.positionAt(found.index));
                let symbolInfo = new vscode.SymbolInformation(
                    found[3], this.getSymbolKind(found[4].toLowerCase()),
                    new vscode.Range(line.range.start, line.range.end));
                symbols.push(symbolInfo);
            }
        }
        return symbols;
    }

    private getSymbolKind(type: string): vscode.SymbolKind {

        if (type === 'function')
            return vscode.SymbolKind.Function;
        else if (type === 'procedure')
            return vscode.SymbolKind.Method;
        else
            return vscode.SymbolKind.Package; // Specification or Body
    }
}
