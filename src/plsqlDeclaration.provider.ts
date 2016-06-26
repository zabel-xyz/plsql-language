'use strict';

import vscode = require('vscode');

interface PLSQLDefinition {
	file: string;
	line: number;
	col: number;
}

export class PLSQLDefinitionProvider implements vscode.DefinitionProvider {

	private getPackageName(document) {
		let regexp = /\b((create)(\s*or\s+replace)?\s*package)(\s*body)?\s*\w*/gi;
		for (let index = 0; index < document.lineCount; index++) {
			regexp.lastIndex = 0;
			let found = regexp.exec(document.lineAt(index).text);
			if (found) {
				// return last word = package name
				return found.input.split(/\s+/ig).slice(-1)
			}
		}
	}

	private getDefinition(document: vscode.TextDocument, regexp, line): PLSQLDefinition {

		// Find in current text (in another line)
		// sicnce end to get body first
		for (let index = document.lineCount - 1; index >= 0; index--) {
			if (index !== line) {
				regexp.lastIndex = 0;
				let found = regexp.exec(document.lineAt(index).text);
				if (found) {
					return {file: document.fileName, line: index, col: 0};
				}
			}
		}
		return null;
	}

	public provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.Location {
		let definition: PLSQLDefinition;

		let packageName = this.getPackageName(document);

		let currentWord = document.getText(document.getWordRangeAtPosition(position));
		let line = document.lineAt(position).text;

		let fctRegExp = new RegExp('\\b(function|procedure)\\s*' + currentWord, 'i');
		if (line.search(fctRegExp) >= 0) {
			definition = this.getDefinition(document, fctRegExp, position.line);
		} else {
			let pkgRegExp = new RegExp('\\b'+packageName +'.'+ currentWord, 'i');
			if (line.search(pkgRegExp) >= 0) {
				definition = this.getDefinition(document, fctRegExp, position.line);
			}
		}

		if (definition == null)
			return null;
		return new vscode.Location(vscode.Uri.file(definition.file), new vscode.Position(definition.line, definition.col));
	}

}

/*
TODO:
   otherpackageName.name => search in other file
   function/procedure name => search same as current line in another file
   ...
*/