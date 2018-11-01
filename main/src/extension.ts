import * as vscode from 'vscode';

import { PLSQLDefinitionProvider } from './provider/plsqlDefinition.provider';
import { PLSQLDocumentSymbolProvider } from './provider/plsqlDocumentSymbol.provider';
import { PLSQLCompletionItemProvider } from './provider/plsqlCompletionItem.provider';
import { PLSQLHoverProvider } from './provider/plsqlHover.provider';
import { PLSQLSignatureProvider } from './provider/plsqlSignature.provider';

import { PLSQLSettings } from './plsql.settings';

import { ConnectController }  from './connect/connect.controller';
import ConnectUIController  from './connect/connectUI.controller';
import { ConnectStatusBar } from './connect/connect.statusBar';
import { QueryController } from './query/query.controller';
import { OracleService } from './client-oracle/oracle.server';

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

    // Oracle connection
    activateOracleConnection();

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

    // Query
    const queryController = new QueryController(context, connectController);
    context.subscriptions.push(vscode.commands.registerCommand('plsql.executeCommand',
        queryController.executeCommand, queryController));
    context.subscriptions.push(vscode.commands.registerCommand('plsql.createConnection',
        queryController.createConnection, queryController));
    context.subscriptions.push(vscode.commands.registerCommand('plsql.removeConnection',
        queryController.removeConnection, queryController));
    // context.subscriptions.push(vscode.commands.registerTextEditorCommand('plsql.runScript',
    //     queryController.runScript, queryController));
    context.subscriptions.push(vscode.commands.registerTextEditorCommand('plsql.runQuery',
        queryController.runQuery, queryController));

    vscode.workspace.onDidChangeConfiguration(configChangedEvent => {
        if (!configChangedEvent.affectsConfiguration('plsql-language'))
            return;

        connectController.configurationChanged();

        if (configChangedEvent.affectsConfiguration('plsql-language.signatureHelp'))
            activateSignatureHelp();
        if (configChangedEvent.affectsConfiguration('plsql-language.hover'))
            activateHover();
        if (configChangedEvent.affectsConfiguration('plsql-language.oracleConnection.enable'))
            activateOracleConnection();
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

    function activateOracleConnection() {
        const enable = PLSQLSettings.getOracleConnectionEnable();
        OracleService.activate(enable, context.asAbsolutePath(''));
    }
}

function deactivate() {
    OracleService.activate(false, '', true);
}
