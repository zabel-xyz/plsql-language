import * as vscode from 'vscode';

import { PlSqlNavigatorVSC as PlSqlNavigator }  from './plsqlNavigator.vscode';
import PlSqlParser from './plsqlParser.vscode';

export class PLSQLSignatureProvider implements vscode.SignatureHelpProvider {

    public enable: boolean;

    public provideSignatureHelp(document: vscode.TextDocument, position: vscode.Position,
        token: vscode.CancellationToken): vscode.ProviderResult<vscode.SignatureHelp> {
            return new Promise<vscode.SignatureHelp>((resolve, reject) => {

                if (!this.enable)
                    resolve();

                let theCall = this.walkBackwardsToBeginningOfCall(document, position);
                if (theCall == null)
                    return resolve(null);
                let callerPos = this.previousTokenPosition(document, theCall.openParen);

                // TODO use cache
                PlSqlNavigator.getDeclaration(document, callerPos)
                .then(symbol => {
                    if (symbol) {
                        let result = new vscode.SignatureHelp(),
                            si: vscode.SignatureInformation;

                        const symbolDoc = PlSqlParser.getFormatSymbolDocumentation(symbol);

                        si = new vscode.SignatureInformation(symbol.definition, symbolDoc);
                        si.parameters = PlSqlParser.parseParams(symbol)
                                .filter(p => p.kind !== PLSQLParamKind.return)
                                .map(p => new vscode.ParameterInformation(p.text));
                        result.signatures = [si];
                        result.activeSignature = 0;
                        result.activeParameter = Math.min(theCall.commas.length, si.parameters.length - 1);
                        return resolve(result);
                    } else
                        return resolve(null);
                })
                .catch(err => {
                    reject(err);
               });
            });
    }

    private walkBackwardsToBeginningOfCall(document: vscode.TextDocument, position: vscode.Position): {
            openParen: vscode.Position, commas: vscode.Position[] } {
        let parenBalance = 0;
        let commas = [];
        let maxLookupLines = 30;

        for (let line = position.line; line >= 0 && maxLookupLines >= 0; line--, maxLookupLines--) {
            let currentLine = document.lineAt(line).text;
            let characterPosition = document.lineAt(line).text.length - 1;

            if (line === position.line) {
                characterPosition = position.character;
                currentLine = currentLine.substring(0, position.character);
            }

            for (let char = characterPosition; char >= 0; char--) {
                switch (currentLine[char]) {
                    case '(':
                        parenBalance--;
                        if (parenBalance < 0) {
                            return {
                                openParen: new vscode.Position(line, char),
                                commas: commas
                            };
                        }
                        break;
                    case ')':
                        parenBalance++;
                        break;
                    case ',':
                        if (parenBalance === 0) {
                            commas.push(new vscode.Position(line, char));
                        }
                }
            }
        }
        return null;
    }

    private previousTokenPosition(document: vscode.TextDocument, position: vscode.Position): vscode.Position {
        while (position.character > 0) {
            let word = document.getWordRangeAtPosition(position);
            if (word) {
                return word.start;
            }
            position = position.translate(0, -1);
        }
        return null;
    }
}

// /**
//  * @desription
//  *    My description multi-lines
//  *    second line
//  * @param {string} Texte Description
//  * @param {number} Texte Description
//  * @return {number} Description
//  *
//  */

// _@description_ -
// My description multi-lines
// second line
// <br> _@param_ **string** `Texte` - description
// <br> _@param_ **number** `Texte` - description
// <br> _@return_ **number** - description
