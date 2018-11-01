import * as vscode from 'vscode';

export default class PLSQLChannel {
    private static _channel: vscode.OutputChannel;

    public static show() {
        if (this._channel)
            this._channel.show();
    }

    public static log(text: string) {
        if (!this._channel)
            this._channel = vscode.window.createOutputChannel('PLSQL');
        this._channel.appendLine(text);
    }

    public static dispose() {
        if (this._channel)
            this._channel.dispose();
    }
}
