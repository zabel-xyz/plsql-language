import * as vscode from 'vscode';

import { PLSQLDefinitionProvider } from './plsqlDefinition.provider';
import { PLSQLDocumentSymbolProvider } from './plsqlDocumentSymbol.provider';
import { PLSQLCompletionItemProvider } from './plsqlCompletionItem.provider';
import { PLSQLHoverProvider } from './plsqlHover.provider';
import { PLSQLSignatureProvider } from './plsqlSignature.provider';

import { PLSQLSettings } from './plsql.settings';

import { ConnectController }  from './connect.controller';
import ConnectUIController  from './connectUI.controller';
import { ConnectStatusBar } from './connect.statusBar';

export function activate(context: vscode.ExtensionContext) {

    // Default without $# redefinded here
    // because plsql.configuration.json don't work with getWordRangeAtPosition() according to issue #42649
    vscode.languages.setLanguageConfiguration('plsql', {
        wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\%\^\&\*\(\)\-\=\+\[\{\]\}\|\;\:\'\"\,\.\<\>\/\?\s]+)/
    });

    let hoverProvider, signatureHelpProvider;

    // language providers
    activateHover();
    activateSignatureHelp();

    context.subscriptions.push(vscode.languages.registerCompletionItemProvider('plsql', new PLSQLCompletionItemProvider(), '.', '\"'));
    context.subscriptions.push(vscode.languages.registerDefinitionProvider('plsql', new PLSQLDefinitionProvider()));

    // context.subscriptions.push(vscode.languages.registerReferenceProvider('plsql', new PLSQLReferenceProvider()));
    // context.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider('plsql', new PLSQLDocumentFormattingEditProvider()));
    context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider('plsql', new PLSQLDocumentSymbolProvider()));
    // context.subscriptions.push(vscode.languages.registerWorkspaceSymbolProvider(new PLSQLWorkspaceSymbolProvider()));
    // context.subscriptions.push(vscode.languages.registerRenameProvider('plsql', new PLSQLRenameProvider()));
    // context.subscriptions.push(vscode.languages.registerCodeActionsProvider('plsql', new PLSQLCodeActionProvider()));

    // Connection
    const connectController = new ConnectController();
    const connectStatusBar = new ConnectStatusBar(connectController);
    const connectUIController = new ConnectUIController(context, connectController);
    context.subscriptions.push(vscode.commands.registerCommand('plsql.activateConnection',
            connectUIController.activateConnectionsList, connectUIController));

    vscode.workspace.onDidChangeConfiguration(configChangedEvent => {
        if (!configChangedEvent.affectsConfiguration('plsql-language'))
            return;

        connectController.configurationChanged();

        if (configChangedEvent.affectsConfiguration('plsql-language.signatureHelp'))
            activateSignatureHelp();
        if (configChangedEvent.affectsConfiguration('plsql-language.hover'))
            activateHover();

    });

    function activateHover() {
        const enable = PLSQLSettings.getHoverEnable();

        if (!hoverProvider && enable) {
            hoverProvider = new PLSQLHoverProvider();
            context.subscriptions.push(vscode.languages.registerHoverProvider('plsql', hoverProvider));
        }
        if (hoverProvider)
            hoverProvider.enable = enable;
    }

    function activateSignatureHelp() {
        const enable = PLSQLSettings.getSignatureEnable();

        if (!signatureHelpProvider && enable) {
            signatureHelpProvider = new PLSQLSignatureProvider();
            context.subscriptions.push(vscode.languages.registerSignatureHelpProvider('plsql', signatureHelpProvider, '(', ','));
        }
        if (signatureHelpProvider)
            signatureHelpProvider.enable = enable;
    }
}

// function deactivate() {
// }
