import * as vscode from 'vscode';

import { ConnectController} from './connect.controller';
import { PLSQLConnection } from '../plsql.settings';
import ConnectInputPanel from './connect.inputPannel';

export default class ConnectUIController {

    constructor(private context: vscode.ExtensionContext, private controller: ConnectController) {
    }

    public activateConnectionsList() {

        let connections: PLSQLConnection[];
        const active = this.controller.getActive();
        if (active) {
            connections = this.controller.getConnections().filter(item => item !== active);
            connections.unshift(active);
        } else
            connections = this.controller.getConnections();

        const displayItems: {
            label: string;
            item: PLSQLConnection | undefined;
            action: string;
        }[] = connections
            .filter(item => item.active || !item.hidden)
            .map(item => {
                return {
                    label: `${item.active ? '$(check) ' : ''} ${item.name}`,
                    item: item,
                    action: 'setActive'
                };
            });
        displayItems.push({
            label: '<Insert a new connection>',
            item: undefined,
            action: 'addConnection'
        });
        displayItems.push({
            label: '<Settings>',
            item: undefined,
            action: 'showSettings'
        });

        vscode.window.showQuickPick(displayItems)
            .then(val => {
                if (val) {
                    // Use explicit method calls instead of dynamic indexing
                    switch (val.action) {
                        case 'setActive':
                            this.setActive(val.item as PLSQLConnection);
                            break;
                        case 'addConnection':
                            this.addConnection();
                            break;
                        case 'showSettings':
                            this.showSettings();
                            break;
                    }
                }
            });
    }

    // used via displayItem.action
    /*private*/ setActive(connection: PLSQLConnection) {
        this.controller.setActive(connection, true);
        this.controller.saveConnections();
    }
    /*private*/ addConnection() {
        ConnectInputPanel.createOrShow(this.context.extensionPath, this.controller, false);
    }
    /*private*/ showSettings() {
        // vscode.commands.executeCommand('workbench.action.openSettings');
        ConnectInputPanel.createOrShow(this.context.extensionPath, this.controller, true);
    }

}
