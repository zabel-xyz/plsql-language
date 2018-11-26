import { createConnection, IConnection } from 'vscode-languageserver';
import * as fs from 'fs';

export class OracleConnection {

    // Create a connection for the server. The connection uses Node's IPC as a transport.
    // Also include all preview / proposed LSP features.
    private static _connection: IConnection;
    private static _oracleDB;
    private static _oracleConnection;

    private static _customID = 0;
    private static _customConnections = {};

    public static init() {
        this._connection = createConnection(/*ProposedFeatures.all*/);
        [
            {name: 'Oracle/install', fn: this.installOracle},
            {name: 'Oracle/init', fn: this.initOracle},
            {name: 'Oracle/connect', fn: this.connect},
            {name: 'Oracle/disconnect', fn: this.disconnect},
            {name: 'Oracle/execCommand', fn: this.execCommand}
        ].forEach(request => {
            this._connection.onRequest(request.name, (params) => request.fn.call(this, params));
        });
        this._connection.listen();
    }

    private static createOracleDirectory() {
        return new Promise<any>((resolve, reject) => {
            const directory = '../node_modules/oracledb';

            fs.stat(directory, (err, stats) => {
                if (!err)
                    return resolve(false);

                // Check if error defined and the error code is "not exists"
                if (err.code === 'ENOENT') {
                    // Create the directory, call the callback.
                    fs.mkdir(directory, error => {
                        if (error)
                            return reject('OracleDB failed create directory '+error);
                        return resolve(true);
                    });
                } else
                    return reject('OracleDB failed check directory '+err);
            });
        });
    }

    // private static installOracle(): Promise<any> {
    //     return new Promise<any>((resolve, reject) => {
    //         this.createOracleDirectory()
    //             .then((install) => {
    //                 if (!install)
    //                     return resolve('OracleDB already installed');

    //                 // No warranty (http://abulletproofidea.com/questions/5157/puis-je-installer-un-paquet-npm-a-partir-de-javascript-execute-dans-node-js)
    //                 // directory npm is deleted, why ???
    //                 const npm = require('npm');
    //                 npm.load({}, err => {
    //                     if (err)
    //                         return resolve({error: 'OracleDB - npm load failed ' + err});

    //                     npm.commands.install(['oracledb@3.0.0'], (err, data) =>  {
    //                         if (err)
    //                             return resolve({error: 'OracleDB - install failed '+ err});
    //                         return resolve('OracleDB - install work '+JSON.stringify(data));
    //                     })
    //                 })
    //             })
    //             .catch(err => resolve({error: err}));
    //     });
    // }

    private static installOracle(): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this.createOracleDirectory()
                .then(install => {
                    if (!install)
                        return resolve('OracleDB already installed');
                    this._connection.sendNotification('Oracle/install', 'Start install oracledb@3.0.1...');
                    require('child_process').exec('npm install '+'oracledb@3.0.1',
                        (err, stdout, stderr) => {
                            this._connection.sendNotification('Oracle/install', '...End install oracledb@3.0.1');
                            if (err)
                                resolve({error: err});
                            if (stderr)
                                resolve({stderror: stderr});
                            resolve({install: stdout});
                    });
                });

        });
    }

    private static initOracle() {
        return new Promise<any>((resolve, reject) => {
            try {
                this._oracleDB = require('oracledb');
                this._oracleDB.fetchAsString = [this._oracleDB.CLOB];
                return resolve('oracleDB work');
            } catch (e) {
                return resolve({error : 'oracleDB failed: '+e + 'ENV: '+process.env});
            }
        });
    }

    private static execCommand(params): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            if (!this._oracleDB)
                return resolve({error: 'OracleDB is missing'});
            if ( !(params && params.connection) && !this._oracleConnection)
                return resolve({error: 'Connection is missing'});

            this.internalExecCommand(params)
                .then(data => resolve(data))
                .catch(err => resolve(err));
        });
    }

    private static internalExecCommand(params): Promise<any> {
        return new Promise<any>((resolve, reject) => {

            const cmd = params.sql.trim().toLowerCase();

            let internalConnection;
            if (params.connection) {
                internalConnection = this._customConnections[params.connection.customID];
                if (!internalConnection)
                    return reject({ params: params, error: 'connection not found ', list: this._customConnections, connection: internalConnection });
            } else
                internalConnection = this._oracleConnection;

            if (cmd === 'commit' || cmd === 'rollback')
                internalConnection[cmd]()
                    .then(() => resolve({ data: cmd }))
                    .catch(err => reject({ error: this.formatOracleError(err) }))
            else {
                // this._connection.sendNotification('Oracle/debug', 'ExecCmd');
                // if no params, don't add an arguments null !
                internalConnection.execute(params.sql)
                    .then(result => resolve({ params: params, data: result }))
                    .catch(err => reject({ params: params, error: this.formatOracleError(err) }));
            }
        });
    }

    private static connect(params): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            if (!this._oracleDB)
                return resolve({error: 'OracleDB is missing'});

            const result: any = {};

            Promise.resolve()
                .then(() => {
                    if (params && !params.custom && this._oracleConnection)
                        return this.disconnect();
                    return;
                })
                .then((data) => {
                    // disconnect error
                    if (data && data.error)
                        result.disconnect = data;
                    return this.internalConnect(params);
                })
                .then(connection => {
                    if (params.custom) {
                        connection.customID = ++this._customID;
                        this._customConnections[connection.customID] = connection;
                    } else
                        this._oracleConnection = connection;

                    result.connection = connection;
                    result.connected = true;

                    if (!params.loginScript)
                        return;
                    else
                        return this.internalExecConnectCommand(params);
                })
                .then(data => {
                    if (data)
                        result.loginScript = data;
                    return resolve(result);
                })
                .catch(err => {
                    result.error = err;
                    return resolve(result);
                });
        });
    }

    private static internalConnect(params): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            if (!params)
                return reject('No params !');

            const connectParams = {
                user: params.user || params.username,
                password: params.password || params.username,
                connectString: params.connectString || params.database,
                privilege: this._oracleDB[params.privilege]
            };
            this._oracleDB.getConnection(connectParams, (err, connection) => {
                if (err)
                    return reject({ error: this.formatOracleError(err), params: connectParams });
                return resolve(connection);
            });
        });
    }

    private static internalExecConnectCommand(params): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this.internalExecCommand({sql: params.loginScript})
                .then(data => resolve(data))
                .catch(err => resolve(err)); // Not considered as connection error
        });
    }

    private static disconnect(params?): Promise<any> {
        return new Promise<any>((resolve, reject) => {

            let internalConnection;
            if (params && params.connection) {
                internalConnection = this._customConnections[params.connection.customID];
                if (!internalConnection)
                    return resolve({ params: params, error: 'connection not found' });
            } else {
                if (!this._oracleConnection)
                    return resolve(true);
                internalConnection = this._oracleConnection;
            }

            internalConnection.close(err => {
                if (err)
                    return resolve({error: err});

                if (params && params.connection)
                    delete this._customConnections[params.connection.customID];
                else
                    delete this._oracleConnection;
                return resolve(true);
            });
        });
    }

    private static formatOracleError(error) {
        // re-format oracle error to be able to stringify
        return {
            message: error.message,
            num: error.errorNum,
            offset: error.offset
        }
    }
}

{
    OracleConnection.init();
}
