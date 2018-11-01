import * as vscode from 'vscode';

import { PLSQLSettings, PLSQLConnection } from '../plsql.settings';

import events = require('events');

export class ConnectController {

    public readonly eventEmitter;
    private active: PLSQLConnection;
    private connections: PLSQLConnection[];
    private activeInfos: string;
    private patternActiveInfos: string;
    private patternName: string;
    private ID = 1;
    private _internalSave = false;

    constructor() {
        this.eventEmitter = new events.EventEmitter();
    }

    public configurationChanged() {
        if (this.connections && !this._internalSave)
            this.getConnections(true);
        else
            this._internalSave = false;
    }

    public getConnections(refresh?: boolean): PLSQLConnection[] {
        if (refresh || !this.connections) {
            const pattern = PLSQLSettings.getConnectionPattern();
            this.patternActiveInfos = pattern.patternActiveInfos;
            this.patternName = pattern.patternName;

            this.connections = PLSQLSettings.getConnections();
            this.active = this.getActive();
            // force only one connection active
            this.connections.forEach(item => {
                item.active = item === this.active;
                item.ID = ++this.ID;
                item.name = this.getName(item);
            });

            // recalc activeInfos, according to active connection and pattern
            this.updateActiveInfos(this.active);
            this.notifyActive(this.active);

            this.saveConnections();
        }
        return this.connections;
    }

    public getConnectionByID(ID: number): PLSQLConnection {
        const connections = this.getConnections();
        if (connections)
            return connections.find(c => c.ID === ID);
    }

    public getConnectionIndexByID(ID: number): number {
        const connections = this.getConnections();
        if (connections)
            return connections.findIndex(c => c.ID === ID);
    }

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

    public getActive(): PLSQLConnection {
        if (!this.active && this.connections)
            this.active = this.connections.find(item => item.active);
        return this.active;
    }

    public setActive(connection: PLSQLConnection, active: boolean) {
        let actConnection;

        if (active) {
            const element = this.getActive();
            if (element)
                element.active = false;
            connection.active = true;
            this.active = connection;
            actConnection = connection;
        } else {
            connection.active = false;
            actConnection = null;
        }

        this.updateActiveInfos(actConnection);
        this.notifyActive(actConnection);
    }

    public getByTag(tag: string): PLSQLConnection {
        if (this.connections)
            return this.connections.find(item => item.tag === tag);
    }

    public addConnection(connection: PLSQLConnection) {
        connection.ID = ++this.ID;
        connection.name = this.getName(connection);

        if (connection.active)
            this.setActive(connection, true);
        this.connections.push(connection);
        this.saveConnections();
    }

    public updateConnection(connection: PLSQLConnection) {
        connection.name = this.getName(connection);
        const idx = this.getConnectionIndexByID(connection.ID);

        if (this.connections[idx].active !== connection.active)
            this.setActive(connection, connection.active);

        this.connections[idx] = connection;
        this.saveConnections();
    }

    public removeConnection(connection: PLSQLConnection | number) {
        if (typeof connection !== 'number')
            connection = this.connections.indexOf(connection);
        if (connection < 0)
            return;

        if (this.connections[connection].active)
            this.setActive(this.connections[connection], false);
        this.connections.splice(connection, 1);
        this.saveConnections();
    }

    public saveConnections() {
        if (!this.connections)
            return;

        this._internalSave = true;
        const config = vscode.workspace.getConfiguration('plsql-language');
        // TODO if no workspace !...
        config.update('connections', this.connections, false);
        config.update('connection.activeInfos', this.activeInfos, false);
    }

    private getName(connection: PLSQLConnection) {
        if (this.patternName)
            return this.patternName
                .replace('${database}', connection.database)
                .replace('${username}', connection.username)
                .replace('${password}', connection.password)
                .replace('${schema}', connection.schema);
        else
            return `unknown ${connection.ID}`;
    }

    private notifyActive(connection: PLSQLConnection) {
        this.eventEmitter.emit('setActive', connection);
    }
}
