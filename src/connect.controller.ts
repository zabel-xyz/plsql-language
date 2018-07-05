import * as vscode from 'vscode';

import { PLSQLSettings, PLSQLConnection } from './plsql.settings';

import events = require('events');

// export interface PLSQLConnectionGroup {
//     group: string;
//     active?: boolean;
//     items: PLSQLConnection[];
// }

export class ConnectController {

    public readonly eventEmitter;
    public active: PLSQLConnection;
    private connections: PLSQLConnection[];
    private activeInfos: string;
    private patternActiveInfos: string;
    private patternName: string;

    constructor() {
        this.eventEmitter = new events.EventEmitter();
    }

    public configurationChanged() {
        if (this.connections)
            this.getConnections(true);
    }

    public getConnections(refresh?: boolean): PLSQLConnection[] {
        if (refresh || !this.connections) {
            this.connections = PLSQLSettings.getConnections();
            this.active = this.connections.find(item => item.active);
            // force only one connection active
            this.connections.forEach(item => {
                item.active = item === this.active;
            });

            const pattern = PLSQLSettings.getConnectionPattern();
            this.patternActiveInfos = pattern.patternActiveInfos;
            this.patternName = pattern.patternName;
            // recalc activeInfos, according to active connection and pattern
            this.updateActiveInfos(this.active);

            this.notifyActive(this.active);
            this.saveConnections();
        }
        return this.connections;
    }

    // public getConnectionsHierarchie(refresh?: boolean): PLSQLConnectionGroup[] {
    //     let group;
    //     const result: PLSQLConnectionGroup[] = [];

    //     this.getConnections(refresh);
    //     if (this.connections) {
      // TODO if !database, group = database ?
    //         this.connections.sort((a,b) => a.database.localeCompare(b.database));
    //         this.connections.forEach(item => {
    //             // TODO if group = database ?
    //             if (!group || (group.group !== item.database)) {
    //                 if (group)
    //                     group.active = group.items.find(connection => connection.active) != null;
    //                 group = {group: item.database, items: []};
    //                 result.push(group);
    //             }
    //             group.items.push(item);
    //         });
    //     }
    //     return result;
    // }

    public updateActiveInfos(connection: PLSQLConnection) {
        this.activeInfos = this.getTextInfos(connection);
    }

    public getTextInfos(connection: PLSQLConnection): string {
        if (this.patternActiveInfos && connection)
            return this.patternActiveInfos
                .replace('${database}', connection.database)
                .replace('${username}', connection.username)
                .replace('${password}', connection.password)
                .replace('${schema}', connection.schema);
        else
            return '';
    }

    public getName(connection: PLSQLConnection, index?: number) {
        if (this.patternName && connection)
            return this.patternName
                .replace('${database}', connection.database)
                .replace('${username}', connection.username)
                .replace('${password}', connection.password)
                .replace('${schema}', connection.schema);
        else
            return ('unknown'+ (index ? index : this.connections.indexOf(connection)));
    }

    public setActive(connection: PLSQLConnection) {
        const element = this.connections.find(item => item.active);
        if (element)
            element.active = false;
        connection.active = true;
        this.updateActiveInfos(connection);
        this.notifyActive(connection);
        this.saveConnections();
    }

    public addConnection(connection: PLSQLConnection) {
        if (connection.active) {
            const element = this.connections.find(item => item.active);
            if (element)
                element.active = false;
            this.updateActiveInfos(connection);
            this.notifyActive(connection);
        }
        this.connections.push(connection);
        this.saveConnections();
    }

    public saveConnections() {
        const config = vscode.workspace.getConfiguration('plsql-language');
        // TODO if no workspace !...
        config.update('connections', this.connections, false);
        config.update('connection.activeInfos', this.activeInfos, false);
    }

    private notifyActive(connection: PLSQLConnection) {
        this.eventEmitter.emit('setActive', connection);
    }
}
