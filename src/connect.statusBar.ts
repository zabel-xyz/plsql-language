import * as vscode from 'vscode';
import { ConnectController } from './connect.controller';
import { PLSQLConnection } from './plsql.settings';

export class ConnectStatusBar {

    private statusBar;
    private statusBarVisible;

    constructor(private controller: ConnectController) {
        const me = this;
        me.statusBar = vscode.window.createStatusBarItem();
        controller.eventEmitter.on('setActive', (connection) => me.activeChange(connection));
        controller.getConnections();
        me.statusBar.command = 'plsql.activateConnection';
    }

    private activeChange(connection: PLSQLConnection) {
        if (connection) {
            this.statusBar.text = `$(database) ${this.controller.getName(connection)}`;
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
