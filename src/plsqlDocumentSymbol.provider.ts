'use strict';

import vscode = require('vscode');

export class PLSQLDocumentSymbolProvider implements vscode.DocumentSymbolProvider {

	private getSymbolKind(text: string): vscode.SymbolKind {

		if (text.startsWith('function'))
			return vscode.SymbolKind.Function
		else if (text.startsWith('procedure'))
			return vscode.SymbolKind.Method
		else
			return vscode.SymbolKind.Package // Specification or Body
	}

	public provideDocumentSymbols(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.SymbolInformation[] {

		let regexp = /\b(function|procedure|((create)(\s*or\s+replace)?\s*package)(\s*body)?)\s*\w*/gi;
		let symbols: vscode.SymbolInformation[] = [];

		for (let index = 0; index < document.lineCount; index++) {
			regexp.lastIndex = 0;
			let found = regexp.exec(document.lineAt(index).text);
			if (found) {
				let symbolInfo = new vscode.SymbolInformation(
					found[0],
					this.getSymbolKind(found[0].toLowerCase()),
					new vscode.Range(index, found.index, index, found.index))
				symbols.push(symbolInfo);
			};
		}

		return symbols;
	}
}
