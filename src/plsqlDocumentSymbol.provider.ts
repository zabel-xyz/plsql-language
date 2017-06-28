import * as vscode from 'vscode';

export class PLSQLDocumentSymbolProvider implements vscode.DocumentSymbolProvider {

    public provideDocumentSymbols(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.SymbolInformation[] {
        const regComment = `(?:\\/\\*[\\s\\S]*?\\*\\/)|(?:--.*)`;
        const regFind = `${regComment}|(?:create(?:\\s+or\\s+replace)?\\s+)?((\\b(?:function|procedure|package)\\b(?:\\s+body)?)\\s+(?:\\w+\\.)?\\w+)`;
        const regConst = `${regComment}|(\\b\\w+.*\\b)\\s*\\s+(\\w*)\\((\\bfunction|procedure\\b)?`;
        const regexp = new RegExp(regFind, 'gi');
        const regexpCons = new RegExp(regConst, 'gi');

        const symbols: vscode.SymbolInformation[] = [],
              text = document.getText();

        let found;
        while (found = regexp.exec(text)) {
            if (found[1]) {
                let line = document.lineAt(document.positionAt(found.index));
                let symbolInfo = new vscode.SymbolInformation(
                    found[1], this.getSymbolKind(found[2].toLowerCase()),
                    new vscode.Range(line.range.start, line.range.end));
                symbols.push(symbolInfo);
            }
        }
        let constant;
        while (constant = regexpCons.exec(text)) {
            if (constant[2]) {
                if (constant[1].toLowerCase() !== "function" && constant[1].toLowerCase() !== "procedure"){
                    let line = document.lineAt(document.positionAt(constant.index));
                    let icon;
                    if(constant[1].toLowerCase().indexOf("constant") > 0)
                       icon = vscode.SymbolKind.Constant;
                    else icon = vscode.SymbolKind.Key;
                    let symbolInfo = new vscode.SymbolInformation(
                        constant[1]+" "+constant[2], icon,
                        new vscode.Range(line.range.start, line.range.end));
                    symbols.push(symbolInfo);
                }
                else return symbols;
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
