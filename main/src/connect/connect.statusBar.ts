import * as vscode from 'vscode';
import { ConnectController } from './connect.controller';
import { PLSQLConnection } from '../plsql.settings';

export class ConnectStatusBar {

    private statusBar: vscode.StatusBarItem;
    private statusBarVisible: boolean = false;

    constructor(controller: ConnectController) {
        this.statusBar = vscode.window.createStatusBarItem();
        controller.eventEmitter.on('setActive', (connection) => this.activeChange(connection));
        controller.getConnections();
        this.statusBar.command = 'plsql.activateConnection';
    }

    private activeChange(connection: PLSQLConnection) {
        if (connection) {
            this.statusBar.text = `$(database) ${connection.name}`;
            // this.statusBar.tooltip =;
        } else {
            this.statusBar.text = `$(database) <none>`;
            // this.statusBar.tooltip =;
        }

        if (!this.statusBarVisible && connection) {
            this.statusBar.show();
            this.statusBarVisible = true;
        }
    }
}
