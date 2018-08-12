import * as vscode from 'vscode';

import { PlSqlNavigatorVSC as PlSqlNavigator }  from './plsqlNavigator.vscode';

export class PLSQLHoverProvider implements vscode.HoverProvider {

    public provideHover(document: vscode.TextDocument, position: vscode.Position,
        token: vscode.CancellationToken): vscode.ProviderResult<vscode.Hover> {
            return new Promise<vscode.Hover>((resolve, reject) => {

                // TODO use documentation (comment above function)
                // TODO use cache
                PlSqlNavigator.getDeclaration(document, position)
                .then(symbol => {
                    if (symbol) {
                        const hoverText = [];
                        let value;
                        if (symbol.definition)
                            value = symbol.definition;
                        else
                            value = symbol.kindName;
                        hoverText.push({language: 'plsql', value: value});
                        if (symbol.documentation)
                            hoverText.push(symbol.documentation);
                        resolve(new vscode.Hover(hoverText));
                    } else
                        resolve();
                })
                .catch(err => {
                    reject(err);
                });
            });
    }
}
