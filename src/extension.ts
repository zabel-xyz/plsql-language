import * as vscode from 'vscode';

import { PLSQLDefinitionProvider } from './plsqlDefinition.provider';
import { PLSQLDocumentSymbolProvider } from './plsqlDocumentSymbol.provider';
import { PLSQLCompletionItemProvider } from './plsqlCompletionItem.provider';

import { ConnectController }  from './connect.controller';
import ConnectUIController  from './connectUI.controller';
import { ConnectStatusBar } from './connect.statusBar';

export function activate(context: vscode.ExtensionContext) {

    // language providers
    // context.subscriptions.push(vscode.languages.registerHoverProvider('plsql', new PLSQLHoverProvider()));
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider('plsql', new PLSQLCompletionItemProvider(), '.', '\"'));

    context.subscriptions.push(vscode.languages.registerDefinitionProvider('plsql', new PLSQLDefinitionProvider()));
    // context.subscriptions.push(vscode.languages.registerDefinitionProvider('plsql', new PLSQLDefinitionProviderOld()));

    // context.subscriptions.push(vscode.languages.registerReferenceProvider('plsql', new PLSQLReferenceProvider()));
    // context.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider('plsql', new PLSQLDocumentFormattingEditProvider()));
    context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider('plsql', new PLSQLDocumentSymbolProvider()));
    // context.subscriptions.push(vscode.languages.registerWorkspaceSymbolProvider(new PLSQLWorkspaceSymbolProvider()));
    // context.subscriptions.push(vscode.languages.registerRenameProvider('plsql', new PLSQLRenameProvider()));
    // context.subscriptions.push(vscode.languages.registerSignatureHelpProvider('plsql', new PLSQLSignatureHelpProvider(), '(', ','));
    // context.subscriptions.push(vscode.languages.registerCodeActionsProvider('plsql', new PLSQLCodeActionProvider()));

    // Connection
    const connectController = new ConnectController();
    const connectStatusBar = new ConnectStatusBar(connectController);
    const connectUIController = new ConnectUIController(context, connectController);
    context.subscriptions.push(vscode.commands.registerCommand('plsql.activateConnection',
            connectUIController.activateConnectionsList, connectUIController));

    vscode.workspace.onDidChangeConfiguration(configChangedEvent => {
        if (configChangedEvent.affectsConfiguration('plsql-language'))
            connectController.configurationChanged();
    });
}

// function deactivate() {
// }
