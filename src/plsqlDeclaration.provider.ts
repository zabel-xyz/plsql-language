'use strict';

import vscode = require('vscode');

interface PLSQLDefinition {
    fileName?: string;
    position?: vscode.Position;
    offset?: number;
}

interface PLSQLRange {
    start: number;
    end: number;
}

interface PLSQLInfos {
    packageName: string;
    specOffset?: number;
    bodyOffset?: number;
}

export class PLSQLDefinitionProvider implements vscode.DefinitionProvider {

    private getPackageInfos(text: string): PLSQLInfos {
        let regexp = /\b((create)(\s*or\s+replace)?\s*package)(\s*body)?\s*\w*/gi,
            infos: PLSQLInfos,
            found;

        do {
            found = regexp.exec(text);
            if (found) {
                found[0] = found[0].toLowerCase();
                // last word = package name
                if (!infos)
                    infos = {packageName: found[0].split(/\s+/ig).slice(-1)[0].toLowerCase()};
                if (found[0].indexOf('body') < 0)
                    infos.specOffset = found.index;
                else
                    infos.bodyOffset = found.index;
            }
        }
        while (found);

        return infos;
    }

    private findFunction(name, text: string, searchRange?: PLSQLRange): number {
        let regexp = new RegExp('\\b(function|procedure)\\s*' + name, 'gi'),
            found;

        do {
            found = regexp.exec(text);
            if (found && (!searchRange || ((found.index > searchRange.start) && (found.index < searchRange.end)) ))
                return found.index;
        }
        while (found);

        return null;
    }

    private getLocation(document: vscode.TextDocument, offset: number): vscode.Location {
        return new vscode.Location(vscode.Uri.file(document.fileName), document.positionAt(offset));
    }

    public provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.Location {
        let line = document.lineAt(position),
            lineText = line.text,
            currentWord = document.getText(document.getWordRangeAtPosition(position)),
            documentText = document.getText(),
            infos: PLSQLInfos,
            offset: number;

        // Get infos of current package
        infos = this.getPackageInfos(documentText);

        // It's the specification line or the body declaration line
        if (this.findFunction(currentWord, lineText) !== null) {
            if (infos.specOffset != null && infos.bodyOffset != null) {
                let searchRange: PLSQLRange;
                if (document.offsetAt(line.range.start) < infos.bodyOffset)
                    searchRange = {start: infos.bodyOffset, end: Number.MAX_VALUE};
                else
                    searchRange = {start: 0, end: infos.bodyOffset};
                if (offset = this.findFunction(currentWord, documentText, searchRange))
                    return this.getLocation(document, offset)
                else
                    return null;
            } else {
                // TODO: search in another file (spec and body are in separate files)
            }
        } else {
            // It's a link to another function
            let regExp = new RegExp('\\b\\w+\\.'+ currentWord, 'i'),
                found;
            if (found = regExp.exec(lineText)) {
                let packageName = found[0].split('.', 1)[0].toLowerCase();
                // In the same package
                if (infos.packageName === packageName) {
                    if (offset = this.findFunction(currentWord, documentText, {start: infos.bodyOffset, end: Number.MAX_VALUE}))
                        return this.getLocation(document, offset);
                    else
                        return null;
                } else {
                    // TODO
                    // Search in another file (after body)
                    // if it's not a keyword, string, number => exit
                    // 1) *packageName*.*
                    // 2) *.*
                }
            } else {
                if (offset = this.findFunction(currentWord, documentText, {start: infos.bodyOffset, end: Number.MAX_VALUE}))
                    return this.getLocation(document, offset);
                else {
                    // TODO Search in another file (after body)
                    // if it's not a keyword, string, number => exit
                    // And it's not a package ! (perhaps a function)
                }
            }
        }
        return null;
    }

}