import * as vscode from 'vscode';

import PlSqlParser from './plsqlParser.vscode';

import { PlSqlNavigatorVSC as PlSqlNavigator }  from './plsqlNavigator.vscode';

export class PLSQLDefinitionProvider implements vscode.DefinitionProvider {

    public provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Thenable<vscode.Location> {

        return new Promise<vscode.Location>((resolve, reject) => {

            PlSqlNavigator.goto(document, position)
                .then(symbol => {
                    return this.getFileLocation(symbol);
                })
                .then(location => {
                    return resolve(location);
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    private getFileLocation(navigateSymbol: PLSQLSymbol): Promise<vscode.Location> {
        return new Promise((resolve, reject) => {
            if (navigateSymbol)
                vscode.workspace.openTextDocument(PlSqlParser.getSymbolFileName(navigateSymbol))
                    .then(document => {
                        resolve(this.getLocation(document, navigateSymbol));
                    });
            else
                resolve();
        });
    }

    private getLocation(document: vscode.TextDocument, navigateSymbol: PLSQLSymbol): vscode.Location {
        if (navigateSymbol)
            return new vscode.Location(vscode.Uri.file(document.fileName), document.positionAt(navigateSymbol.offset));
        else
            return null;
    }

}
