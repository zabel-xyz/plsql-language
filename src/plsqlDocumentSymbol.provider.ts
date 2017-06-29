import * as vscode from 'vscode';

export class PLSQLDocumentSymbolProvider implements vscode.DocumentSymbolProvider {

    public provideDocumentSymbols(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.SymbolInformation[] {
        const regComment = `(?:\\/\\*[\\s\\S]*?\\*\\/)|(?:--.*)`;
        const regFind = `${regComment}|(?:create(?:\\s+or\\s+replace)?\\s+)?((\\b(?:function|procedure|package)\\b(?:\\s+body)?)\\s+(?:\\w+\\.)?\\w+)`;
        const regConst = `${regComment}|((\\bfunction|procedure\\b)\\s+\\w+)|((\\w*.)\\s+(constant)\\s+(\\w+))|((\\btype\\b)\\s+(\\b\\w+\\b))\\s*|((\\b\\w+.\\b)\\s+(\\b\\w+\\b)\\s*(\\(\\s*\\w*\\s*\\)\\s*;))`;
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
            // if begins functions or procedures, then stop
            if (constant[2]){
                if(constant[2].toLowerCase() === "function" || constant[2].toLowerCase() === "procedure" )
                   break;
            }
            // Constant
            else if (constant[5]) { 
                let line = document.lineAt(document.positionAt(constant.index));
                let symbolInfo = new vscode.SymbolInformation(
                    constant[5].toLowerCase()+" "+constant[4].toLowerCase()+" "+constant[6].toLowerCase(), this.getSymbolKind(constant[5].toLowerCase()),
                    new vscode.Range(line.range.start, line.range.end));
                symbols.push(symbolInfo);
            }
            // Variables
            else if (constant[12]) { 
                let line = document.lineAt(document.positionAt(constant.index));
                let symbolInfo = new vscode.SymbolInformation(
                    constant[11].toLowerCase()+" "+constant[12].toLowerCase(), vscode.SymbolKind.Variable,
                    new vscode.Range(line.range.start, line.range.end));
                symbols.push(symbolInfo);
            }
            //Types
            else if (constant[8]) { 
                let line = document.lineAt(document.positionAt(constant.index));
                let symbolInfo = new vscode.SymbolInformation(
                    constant[8].toLowerCase()+" "+constant[9].toLowerCase(), this.getSymbolKind(constant[8].toLowerCase()),
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
        else if (type === 'constant')
            return vscode.SymbolKind.Constant;
        else if (type === 'type')
            return vscode.SymbolKind.Struct;
        else
            return vscode.SymbolKind.Package; // Specification or Body
    }
}
