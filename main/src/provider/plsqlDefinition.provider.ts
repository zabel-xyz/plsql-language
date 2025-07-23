import * as vscode from 'vscode';
import '../lib/definition';

import PlSqlParser from '../plsqlParser.vscode';

import { PlSqlNavigatorVSC as PlSqlNavigator }  from '../plsqlNavigator.vscode';

export class PLSQLDefinitionProvider implements vscode.DefinitionProvider {

    public provideDefinition(document: vscode.TextDocument, position: vscode.Position, _token: vscode.CancellationToken): Thenable<vscode.Location | undefined> {

        return new Promise<vscode.Location | undefined>((resolve, _reject) => {

            PlSqlNavigator.goto(document, position)
                .then(symbol => {
                    if (symbol) {
                        return this.getFileLocation(symbol);
                    } else {
                        return Promise.resolve(undefined);
                    }
                })
                .then(location => {
                    return resolve(location);
                })
                .catch(err => {
                    console.error(err);
                    resolve(undefined);
                });
        });
    }

    private getFileLocation(navigateSymbol: PLSQLSymbol): Promise<vscode.Location | undefined> {
        return new Promise((resolve, _reject) => {
            const fileName = PlSqlParser.getSymbolFileName(navigateSymbol);
            if (navigateSymbol && fileName) {
                vscode.workspace.openTextDocument(fileName)
                    .then(document => {
                        resolve(this.getLocation(document, navigateSymbol));
                    }, () => {
                        resolve(undefined);
                    });
            } else {
                resolve(undefined);
            }
        });
    }

    private getLocation(document: vscode.TextDocument, navigateSymbol: PLSQLSymbol): vscode.Location | undefined {
        if (navigateSymbol && navigateSymbol.offset !== undefined)
            return new vscode.Location(vscode.Uri.file(document.fileName), document.positionAt(navigateSymbol.offset));
        else
            return undefined;
    }

}
