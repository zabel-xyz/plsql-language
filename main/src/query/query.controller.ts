import * as vscode from 'vscode';

import QueryGridView from './query.gridview';
import { OracleService } from '../client-oracle/oracle.server';
import { ConnectController } from '../connect/connect.controller';
import { PLSQLConnection } from '../plsql.settings';
import PLSQLChannel from '../plsqlChannel';

export class QueryController {

    private _activeConnection: PLSQLConnection;

    constructor(private context: vscode.ExtensionContext,
                private connectionCtrl: ConnectController) {
        connectionCtrl.eventEmitter.on('setActive',
            connection => this.doConnectChange(connection));

        // Init first connection
        this.doConnectChange(connectionCtrl.getActive());
    }

    public executeCommand(param) {
        if (!param)
            return;

        if (typeof param === 'string')
            param = {sql: param};
        else if (param.connection && param.connection.connection)
            param.connection = param.connection.connection;

        param.silent = true;
        // if (param.script)
        //     return this.internalRunScript(param);
        // else
            return this.internalRunQuery(param);
    }

    public createConnection(param) {
        if (!param)
            return;

        if (param.tag) {
            const connection = this.connectionCtrl.getByTag(param.tag);
            if (connection)
                return Promise.reject(`Cannot connect tag ${param.tag} not found`);
            else
                param = connection;
        }
        param.silent = true;
        param.custom = true;

        return OracleService.connect(param);
    }

    public removeConnection(param) {
        if (!param)
            return;

        if (param.connection && param.connection.connection)
            param.connection = param.connection.connection;

        param.silent = true;
        param.custom = true;
        return OracleService.disconnect(param);
    }

    public async runQuery(editor: vscode.TextEditor) {
        const text = this.getTextFromRange(editor, this.getSelectionRange(editor));
        return this.internalRunQuery({sql: text});
    }

    // public runScript(editor: vscode.TextEditor) {
    //     const text = editor.document.getText();
    //     return this.internalRunScript(sql: text});
    // }

    private internalRunQuery(param) {
        return new Promise<any>((resolve, reject) => {
            let p;

            if (!param.connection && !OracleService.isConnected())
                p = OracleService.connect(this._activeConnection);
            else
                p = Promise.resolve();
            p.then(data => {
                if (!param.silent && data && data.loginScript) {
                    PLSQLChannel.show();
                    PLSQLChannel.log(JSON.stringify(data.loginScript));
                }
                return OracleService.execCommand(param); // TODO input params
            })
            .then((data) => {
                if (!param.silent)
                    this.showQueryResult(data);
                return resolve(data);
            })
            .catch((err) => {
                if (!param.silent) {
                    vscode.window.showErrorMessage(JSON.stringify(err));
                }
                return reject(err);
            });
        });
    }

    // TODO
    // Actuatlly oracleDB doesn't run script !
    // private internalRunScript(param) {
    //     return new Promise<any>((resolve, reject) => {

    //         let p;

    //         if (OracleService.isConnected())
    //             p = OracleService.connect(this._activeConnection); // TODO no connection error
    //         else
    //             p = Promise.resolve();
    //         p.then(() => {
    //             return OracleService.execCommand(param.sql);
    //         })
    //         .then((data) => {
    //             if (!param.silent) {
    //                 PLSQLChannel.show();
    //                 PLSQLChannel.log(data);
    //                 PLSQLChannel.log('script terminated with success');
    //             }
    //             return resolve(data);
    //         })
    //         .catch((err) => {
    //             if (!param.silent) {
    //                 vscode.window.showErrorMessage(err);
    //             }
    //             return reject(err);
    //         });
    //     });
    // }

    private showQueryResult(data) {
        if (data.data.metaData || data.data.rows)
            QueryGridView.createOrShow(this.context.extensionPath, data);
        else {
            PLSQLChannel.show();
            PLSQLChannel.log(JSON.stringify(data.data));
        }
    }

    private doConnectChange(connection: PLSQLConnection) {
        OracleService.disconnect()
            .catch((err) => {
                if (err.disconnect)
                    vscode.window.showErrorMessage(err.disconnect);
                if (err.error)
                    vscode.window.showErrorMessage(err.error);
            });
        this._activeConnection = connection;
    }

    private getSelectionRange(editor: vscode.TextEditor): vscode.Range {

        if (!editor.selection.isEmpty) {
            return new vscode.Range(editor.selection.start, editor.selection.end);
        }

        if (editor.document.lineCount === 0)
            return;

        // Get text delimited by /

        let lineStart;
        if (editor.selection)
            lineStart = editor.selection.start.line;
        else
            lineStart = 0;

        let lineEnd = lineStart;

        -- lineStart;
        let chrStart = 0, found = false;
        while (lineStart >= 0) {
            let text = editor.document.lineAt(lineStart).text;
            if ((chrStart = text.search(/\//i)) > -1) {
                found = true;
                break;
            }
            --lineStart;
        }
        if (!found)
            lineStart = new vscode.Position(0, 0);
        else
            lineStart = editor.document.positionAt(
                editor.document.offsetAt(new vscode.Position(lineStart, chrStart)) + 1);

        found = false;
        let chrEnd = 0;
        while (lineEnd < editor.document.lineCount) {
            let text = editor.document.lineAt(lineEnd).text;
            if ((chrEnd = text.search(/\//i)) > -1) {
                found = true;
                break;
            }
            ++lineEnd;
        }
        if (!found)
            lineEnd = editor.document.lineAt(editor.document.lineCount - 1).range.end;
        else
            lineEnd = editor.document.positionAt(
                editor.document.offsetAt(new vscode.Position(lineEnd, chrEnd)) - 1);

        return new vscode.Range(lineStart, lineEnd);
    }

    private getTextFromRange(editor: vscode.TextEditor, range: vscode.Range): string {
        if (range !== undefined) {
            return editor.document.getText(range);
        }
        return '';
    }

}
