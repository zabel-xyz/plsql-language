import * as vscode from 'vscode';

import { PLSQLDefinitionProvider } from './plsqlDefinition.provider';
import { PLSQLDocumentSymbolProvider } from './plsqlDocumentSymbol.provider';
import { PLSQLCompletionItemProvider } from './plsqlCompletionItem.provider';
import { WorkspaceSymbols, PLSQLWorkspaceSymbolProvider } from './plsqlWorkspaceSymbol.provider'

export function activate(context: vscode.ExtensionContext) {
    if (vscode.workspace.getConfiguration('plsql-language').get<boolean>('workspaceSymbols.enable')) {
        let workspaceSymbols = new WorkspaceSymbols()

        // initial workspace symbol generation
        workspaceSymbols.generate()

        // rebuild command available at any time
        const disposable = vscode.commands.registerCommand('extension.rebuildWorkspaceSymbols', () => {
            workspaceSymbols.generate()
        })

        // on file save we need to rebuild workspace symbols
        vscode.workspace.onDidSaveTextDocument(() => workspaceSymbols.generate())

        context.subscriptions.push(vscode.languages.registerWorkspaceSymbolProvider(new PLSQLWorkspaceSymbolProvider()))
        context.subscriptions.push(workspaceSymbols)
        context.subscriptions.push(disposable)
    }

    // language providers
    // context.subscriptions.push(vscode.languages.registerHoverProvider('plsql', new PLSQLHoverProvider()));
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider('plsql', new PLSQLCompletionItemProvider(), '.', '\"'));
    context.subscriptions.push(vscode.languages.registerDefinitionProvider('plsql', new PLSQLDefinitionProvider()));
    // context.subscriptions.push(vscode.languages.registerReferenceProvider('plsql', new PLSQLReferenceProvider()));
    // context.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider('plsql', new PLSQLDocumentFormattingEditProvider()));
    context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider('plsql', new PLSQLDocumentSymbolProvider()));
    // context.subscriptions.push(vscode.languages.registerRenameProvider('plsql', new PLSQLRenameProvider()));
    // context.subscriptions.push(vscode.languages.registerSignatureHelpProvider('plsql', new PLSQLSignatureHelpProvider(), '(', ','));
    // context.subscriptions.push(vscode.languages.registerCodeActionsProvider('plsql', new PLSQLCodeActionProvider()));
}

// function deactivate() {
// }
