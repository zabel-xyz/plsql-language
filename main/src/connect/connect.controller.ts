import * as vscode from 'vscode';

import { PLSQLSettings, PLSQLConnection } from '../plsql.settings';

import events = require('events');

export class ConnectController {

    public readonly eventEmitter;
    private active: PLSQLConnection | null = null;
    private connections: PLSQLConnection[] = [];
    private activeInfos: string = '';
    private patternActiveInfos: string = '';
    private patternName: string = '';
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
            this.active = null;
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

    public getConnectionByID(ID: number): PLSQLConnection | undefined {
        const connections = this.getConnections();
        if (connections)
            return connections.find(c => c.ID === ID);
        return undefined;
    }

    public getConnectionIndexByID(ID: number): number {
        const connections = this.getConnections();
        if (connections) {
            const index = connections.findIndex(c => c.ID === ID);
            return index >= 0 ? index : -1;
        }
        return -1;
    }

    public updateActiveInfos(connection: PLSQLConnection | null) {
        if (connection) {
            this.activeInfos = this.getTextInfos(connection);
        } else {
            this.activeInfos = '';
        }
    }

    public getTextInfos(connection: PLSQLConnection): string {
        if (this.patternActiveInfos && connection)
            return this.patternActiveInfos
                .replace('${database}', connection.database || '')
                .replace('${username}', connection.username || '')
                .replace('${password}', connection.password || '')
                .replace('${schema}', connection.schema || '');
        else
            return '';
    }

    public getActive(): PLSQLConnection | null {
        if (!this.active && this.connections) {
            const found = this.connections.find(item => item.active);
            this.active = found || null;
        }
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

    public getByTag(tag: string): PLSQLConnection | undefined {
        if (this.connections)
            return this.connections.find(item => item.tag === tag);
        return undefined;
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
        const idx = this.getConnectionIndexByID(connection.ID || 0);

        if (idx >= 0 && this.connections[idx].active !== connection.active)
            this.setActive(connection, connection.active || false);

        if (idx >= 0) {
            this.connections[idx] = connection;
            this.saveConnections();
        }
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

        if (!this.connections.length) {
            const settings = PLSQLSettings.getConnections();
            if (!settings || !settings.length)
                return;
        }

        this._internalSave = true;
        const config = vscode.workspace.getConfiguration('plsql-language');
        // TODO if no workspace !...
        config.update('connections', this.connections, false);
        config.update('connection.activeInfos', this.activeInfos, false);
    }

    private getName(connection: PLSQLConnection) {
        if (this.patternName)
            return this.patternName
                .replace('${database}', connection.database || '')
                .replace('${username}', connection.username || '')
                .replace('${password}', connection.password || '')
                .replace('${schema}', connection.schema || '');
        else
            return `unknown ${connection.ID}`;
    }

    private notifyActive(connection: PLSQLConnection | null) {
        if (connection) {
            this.eventEmitter.emit('setActive', connection);
        }
    }
}
