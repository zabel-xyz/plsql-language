'use strict';

import vscode = require('vscode');

interface PLSQLDefinition {
    fileName?: string;
    position?: vscode.Position;
    offset?: number;
}

interface PLSQLPosition {
    start: number;
    end: number;
}

export class PLSQLDefinitionProvider implements vscode.DefinitionProvider {

    private getPackageName(document) {
        let regexp = /\b((create)(\s*or\s+replace)?\s*package)(\s*body)?\s*\w*/gi;
        for (let index = 0; index < document.lineCount; index++) {
            regexp.lastIndex = 0;
            let found = regexp.exec(document.lineAt(index).text);
            if (found) {
                // return last word = package name
                return found.input.split(/\s+/ig).slice(-1)[0].toLowerCase();
            }
        }
    }

    // private searchInFile() {
    // 	findInfile()
    // 		read
    // 			content cut in lines.foreach
    // 				RegExp.
    // }

    private findFunction(name, text: string, currentPosition?: PLSQLPosition): number {
        let regexp = new RegExp('\\b(function|procedure)\\s*' + name, 'gi');
        let found;

        do {
            found = regexp.exec(text);
            if (found && (!currentPosition || (found.index < currentPosition.start) || (found.index > currentPosition.end)) )
                return found.index;
        }
        while (found);

        return null;
    }

    private getLocation(document: vscode.TextDocument, offset: number): vscode.Location {
        return new vscode.Location(vscode.Uri.file(document.fileName), document.positionAt(offset));
    }

    public provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.Location {
        let offset: number,
            line = document.lineAt(position),
            lineText = line.text,
            currentWord = document.getText(document.getWordRangeAtPosition(position));

        // TODO currentWord = keyword => exit

        // SpecOffset - BodyOffset
        // BodyOffset - end

        // It's the specification line or the body declaration line
        if (this.findFunction(currentWord, lineText) !== null) {
            // TODO
            //if SpecOffSet or BodyOffset is null => anotherFile
            // else if find < BodyOffset or find > BodyOffset => if not found, return null
            let currentPosition = {start: document.offsetAt(line.range.start), end: document.offsetAt(line.range.end)};
            if (offset = this.findFunction(currentWord, document.getText(), currentPosition)) {
                return this.getLocation(document, offset);
            } else {
                // TODO: search in another file
            }
        } else {
            // It's a link to another function in the same package
            let regExp = new RegExp('\\b\\w+\\.'+ currentWord, 'i'),
                found;
            if (found = regExp.exec(lineText)) {
                let currentPackageName = this.getPackageName(document),
                    packageName = found[0].split('.', 1)[0].toLowerCase();
                // TODO search after body => if not found stop
                if ((currentPackageName === packageName) && (offset = this.findFunction(currentWord, document.getText()))) {
                    return this.getLocation(document, offset);
                } else {
                    // TODO
                    // search in another file (after body)
                    // 1) *packageName*.*
                    // 2) *.*
                }
            } else {
                // TODO
                // It's a link without package in this file => search after body
                // or in another file (after body)
            }
        }

        return null;
    }

}