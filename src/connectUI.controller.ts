import * as vscode from 'vscode';

import { ConnectController} from './connect.controller';
import { PLSQLConnection } from './plsql.settings';
import ConnectInputPanel from './connect.inputPannel';

export default class ConnectUIController {

    constructor(private context: vscode.ExtensionContext, private controller: ConnectController) {
    }

    public activateConnectionsList() {
        const me = this;

        let connections = this.controller.getConnections(true);
        const active = this.controller.active;
        if (active) {
            connections = connections.filter(item => item !== active);
            connections.unshift(this.controller.active);
        }

        const displayItems = connections.map((item, index) => {
            return {
                label: `${item.active ? '$(check) ' : ''} ${this.controller.getName(item, index)}`,
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
            .then(val=> {
                if (val) {
                    me[val.action].apply(me, [val.item]);
                }
            });
    }

    // used via displayItem.action
    /*private*/ setActive(connection: PLSQLConnection) {
        this.controller.setActive(connection);
    }
    /*private*/ addConnection() {
        ConnectInputPanel.createOrShow(this.context.extensionPath, this.controller);
    }
    /*private*/ showSettings() {
        vscode.commands.executeCommand('workbench.action.openSettings');
    }

}
