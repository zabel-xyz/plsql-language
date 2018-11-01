import * as vscode from 'vscode';

import * as fs from 'fs';
import * as path from 'path';

import { ConnectController } from './connect.controller';
import { PLSQLConnection } from '../plsql.settings';

/**
 * Manages connect input webview panels
 */
export default class ConnectInputPanel {
    /**
     * Track the currently panel. Only allow a single panel to exist at a time.
     */
    public static currentPanel: ConnectInputPanel | undefined;

    private static readonly viewType = 'ConnectInput';
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionPath: string;
    private _htmlContent: string;
    private _disposables: vscode.Disposable[] = [];


    public static createOrShow(extensionPath: string, controller: ConnectController, showAll: boolean) {
        // If we already have a panel, show it.
        // Otherwise, create a new panel.
        if (ConnectInputPanel.currentPanel) {
            ConnectInputPanel.currentPanel._panel.reveal();
        } else {
            ConnectInputPanel.currentPanel = new ConnectInputPanel(extensionPath, controller, showAll);
        }
    }

    public sendData(connection ?: PLSQLConnection | number) {
        // Send a message to the webview webview.
        // You can send any JSON serializable data.
        const connections = this._controller.getConnections();

        if (this._showAll && connection && (typeof connection === 'number') )
            connection = this._controller.getConnectionByID(connection);

        this._panel.webview.postMessage({
            command: this._showAll ? 'settingsConnections' : 'newConnection',
            data: this._showAll ? {
                connection: connection,
                items: this._controller.getConnections()
            } : null
        });
    }

    public dispose() {
        ConnectInputPanel.currentPanel = undefined;

        // Clean up our resources
        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private constructor(extensionPath: string, private _controller: ConnectController, private _showAll: boolean) {
        this._extensionPath = extensionPath;

        // Create and show a new webview panel
        this._panel = vscode.window.createWebviewPanel(ConnectInputPanel.viewType, 'Connection', vscode.ViewColumn.Active, {
            // Enable javascript in the webview
            enableScripts: true,

            // And restric the webview to only loading content from our extension's `media` directory.
            localResourceRoots: [
                vscode.Uri.file(path.join(this._extensionPath, 'resources', 'webview'))
            ]
        });

        // Set the webview's initial html content
        this._update();

        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Update the content based on view changes
        this._panel.onDidChangeViewState(e => {
            if (this._panel.visible) {
                this._update();
            } else
                this.dispose();
        }, null, this._disposables);

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'submitConnection':
                    if (!message.data.ID)
                        this._controller.addConnection(message.data);
                    else
                        this._controller.updateConnection(message.data);
                    if (!this._showAll)
                        this.dispose();
                    else
                        this.sendData(message.data.ID);
                    return;
                case 'cancelConnection':
                    if (!this._showAll)
                        this.dispose();
                    else
                        this.sendData(message.data.ID);
                    return;
                case 'deleteConnection':
                    const connection = this._controller.getConnectionIndexByID(message.data.ID);
                    if (connection >= 0)
                        this._controller.removeConnection(connection);
                    const connections = this._controller.getConnections();
                    let nextID;
                    if (connection < connections.length)
                        nextID = connections[connection].ID;
                    else if (connection > 0)
                        nextID = connections[connection - 1].ID;
                    this.sendData(nextID);
                    return;
                case 'showConnection':
                    this.sendData(message.data.ID);
                    return;
                case 'newConnection':
                    this.sendData();
                    return;
            }
        }, null, this._disposables);
    }

    private _update() {

        if (this._htmlContent) {
            this._panel.webview.html = this._htmlContent;
            this.sendData(this._showAll ? this._controller.getActive() : null);
        } else
            this._getHtmlForWebview()
                .then(html => {
                    this._htmlContent = html;
                    this._panel.webview.html = html;
                    this.sendData(this._showAll ? this._controller.getActive() : null);
                });
        }


    private _getHtmlForWebview(): Promise<string> {

        // html file
        const htmlPathOnDisk = path.join(this._extensionPath, 'resources','webview', 'connect.html');

        // Local path to main script, css run in the webview
        const scriptPathOnDisk = vscode.Uri.file(path.join(this._extensionPath, 'resources', 'webview', 'connect.js'));
        const cssPathOnDisk = vscode.Uri.file(path.join(this._extensionPath, 'resources', 'webview', 'connect.css'));

        // And the uri we use to load this script in the webview
        const scriptUri = scriptPathOnDisk.with({ scheme: 'vscode-resource' });
        const cssUri = cssPathOnDisk.with({ scheme: 'vscode-resource' });

        // Use a nonce to whitelist which scripts can be run

        return this.readHTMLFile(htmlPathOnDisk, scriptUri, cssUri, this.getNonce());
    }

    private readHTMLFile(file: string, scriptUri, cssUri, nonce): Promise<string> {
        return new Promise((resolve, reject) => {
            fs.readFile(file, 'utf8', (err, data) => {
                if (err)
                    return reject(err);
                const html = data.toString()
                    .replace('${scriptUri}', scriptUri)
                    .replace('${cssUri}', cssUri)
                    .replace(/\${nonce}/g, nonce);
                return resolve(html);
            });
        });
    }

    private getNonce() {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }

}
