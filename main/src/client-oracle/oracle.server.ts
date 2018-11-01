import * as vscode from 'vscode';

import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind
} from 'vscode-languageclient';

import * as path from 'path';

import PLSQLChannel from '../plsqlChannel';

export class OracleService {
    private static _oracleServer;

    public static activate(enable: Boolean, contextPath?: string, silent = false) {
        if (!this._oracleServer && enable) {
            this._oracleServer = new OracleServer(
                    path.join(contextPath, 'server-oracle', 'out'), 'server.js');
        }
        if (this._oracleServer) {
            if (enable)
                this._oracleServer.start()
                    .then(msg => {
                        if (!silent) {
                            // PLSQLChannel.show();
                            PLSQLChannel.log(JSON.stringify(msg));
                        }
                    })
                    .catch(err => {
                        if (!silent)
                            vscode.window.showErrorMessage(JSON.stringify(err));
                    });
            else {
                this._oracleServer.stop()
                    .catch((err) => {
                        if (!silent)
                            vscode.window.showErrorMessage(err);
                    });
                this._oracleServer = null;
            }
        }
    }

    public static execCommand(params): Promise<any> {
        if (this._oracleServer)
            return this._oracleServer.execCommand(params);
        else
            return this.ErrorNoOracleServer();
    }

    public static isConnected(): Boolean {
        if (this._oracleServer)
            return this._oracleServer.isConnected();
        else
            return false;
    }

    public static connect(params): Promise<any> {
        if (this._oracleServer)
            return this._oracleServer.connect(params);
        else
            return this.ErrorNoOracleServer();
    }

    public static disconnect(params?): Promise<any> {
        if (this._oracleServer)
            return this._oracleServer.disconnect(params);
        else
            return this.ErrorNoOracleServer();
    }

    private static ErrorNoOracleServer(): Promise<any> {
        return Promise.reject('No oracle server');
    }
}

class OracleServer {

    private _client: LanguageClient;
    private _isClientReady = false;
    private _isClientInitialized = false;
    private _serverPath: string;
    private _serverModule: string;
    private _isConnected = false;

    constructor(path: string, module: string) {
        this._serverPath = path;
        this._serverModule = module;
    }

    public start(): Promise<any> {
        if (this._client || !this._serverPath)
            return Promise.resolve();

        return new Promise<any>((resolve, reject) => {

            const serverOptions: ServerOptions = {
                runtime: 'node', // run node externally to avoid recompile oracleDB with electron version
                // module: path.join(this._serverPath, this._serverModule),
                module: this._serverModule,
                options: {
                    cwd: this._serverPath
                },
                transport: TransportKind.ipc
            };
            // Options to control the language client
            const clientOptions: LanguageClientOptions = {
            };

            // Create the language client and start the client.
            this._client = new LanguageClient(
                'oracleServer',
                'Oracle Server',
                serverOptions,
                clientOptions
            );

            // Start the client. This will also launch the server
            this._client.start();

            let msg: any; msg = {};
            this._client.onReady()
                .then(() => {
                    this._isClientReady = true;

                    this._client.onNotification('Oracle/install', (data) => {
                        PLSQLChannel.show();
                        PLSQLChannel.log(data);
                    });

                    this._client.onNotification('Oracle/debug', (data) => {
                        PLSQLChannel.show();
                        PLSQLChannel.log(data);
                    });

                    return this.install();
                })
                .then(result => {
                    if (result)
                        msg.install = result;
                    return this.init();
                })
                .then(result => {
                    if (result)
                        msg.init = result;
                    this._isClientInitialized = true;
                    return resolve(msg);
                })
                .catch(err => {
                    msg.error = err;
                    return reject(msg);
                });
        });
    }

    public stop(): Promise<any> {
        return new Promise<any>((resolve, reject) => {

            this.disconnect()
                .then(() => promiseFinally())
                .catch((err) => promiseFinally(err));

            const promiseFinally = (dErr = false) => {
                if (!this._client)
                    return resolve();

                this._client.stop()
                    .then(() => {
                        if (dErr)
                            return reject({disconnect: dErr});
                        return resolve();
                    },
                    (err) => reject({disconnect : dErr, error: err}));
                this._client = null;
            };
        });
    }

    public connect(params): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this.execRequest('Oracle/connect', params)
                .then(result => {
                    if ((!params || !params.custom) && result && result.connected === true)
                        this._isConnected = true;
                    return resolve(result);
                })
                .catch(err => reject(err));
        });
    }

    public disconnect(params?): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this.execRequest('Oracle/disconnect', params)
                .then(result => {
                    if ((!params || !params.custom) && result === true)
                        this._isConnected = false;
                    return resolve(result);
                })
                .catch(err => reject(err));
        });
    }

    public isConnected(): Boolean {
        return this._isConnected;
    }

    public execCommand(params): Promise<any> {
        return this.execRequest('Oracle/execCommand', params);
    }

    private install(): Promise<any> {
        return this.execRequest('Oracle/install', null, true);
    }

    private init(): Promise<any> {
        return this.execRequest('Oracle/init', null, true);
    }

    private execRequest(name: string, params?: any, initRequest: Boolean = false): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            if (!this._client || !this._isClientReady)
                return reject('Client is not ready');

            if (!initRequest && !this._isClientInitialized)
                return reject('Client is not initialized');

            this._client.sendRequest(name, params)
                .then((data: any) => {
                    if (data && data.error)
                        return reject(data);
                    return resolve(data);
                }, error =>
                    reject(error));
        });
    }

}
