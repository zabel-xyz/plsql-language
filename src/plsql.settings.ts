import * as vscode from 'vscode';
import * as path from 'path';

interface PLSQLSynonym {
    replace: string;
    by?: string;
}

export interface PLSQLConnection {
    database: string;
    username: string;
    password?: string;
    schema?: string;
    active?: boolean;
}

/**
 * Settings for plsql.
 */
export class PLSQLSettings {

    // constructor() {
    // }

    public static getSearchInfos(file: vscode.Uri) {

        // ignore search.exclude settings
        let   ignore;
        const searchExclude = <object>vscode.workspace.getConfiguration('search', file).get('exclude');
        if (searchExclude) {
            ignore = Object.keys(searchExclude).filter(key => searchExclude[key]);
        }

        const config = vscode.workspace.getConfiguration('plsql-language');

        // search in specified folder or current workspace
        // const wsFolder = vscode.workspace.getWorkspaceFolder(file);
        // temporary code to resolve bug https://github.com/Microsoft/vscode/issues/36221
        const wsFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(file.fsPath));
        let   cwd =  wsFolder ? wsFolder.uri.fsPath : '',
              searchFld = <string>config.get('searchFolder');
        if (searchFld) {
            cwd = searchFld.replace('${workspaceRoot}', cwd) // deprecated
                           .replace('${workspaceFolder}', cwd);
        }

        return {ignore, cwd};
    }

    // DEPRECATED...
    // public static getSearchFile(searchText: string): string {
    //     const config = vscode.workspace.getConfiguration('plsql-language');

    //     // fileName = convert packageName
    //     let   fileName = searchText;
    //     const replaceSearch = <string>config.get('replaceSearch');
    //     if (replaceSearch) {
    //         const regExp = new RegExp(replaceSearch, 'i');
    //         fileName = fileName.replace(regExp, <string>config.get('replaceValue') || '');
    //     }
    //     return fileName;
    // }

    public static translatePackageName(packageName: string): string {
        const config = vscode.workspace.getConfiguration('plsql-language');

        // packageName using synonym => real packageName
        let   name = packageName;
        const synonym = <PLSQLSynonym>config.get('synonym');
        if (synonym) {
            const regExp = new RegExp(synonym.replace, 'i');
            name = name.replace(regExp, synonym.by || '');
        }
        return name;
    }

    public static getCommentInSymbols(): boolean {
        const config = vscode.workspace.getConfiguration('plsql-language');
        return <boolean>config.get('commentInSymbols');
    }

    public static getHoverEnable(): boolean {
        const config = vscode.workspace.getConfiguration('plsql-language');
        return <boolean>config.get('hover.enable');
    }
    public static getSignatureEnable(): boolean {
        const config = vscode.workspace.getConfiguration('plsql-language');
        return <boolean>config.get('signatureHelp.enable');
    }

    public static getSearchExt(searchExt: string[]) {
        const config = vscode.workspace.getConfiguration('files'),
              assoc = <object>config.get('associations');
        let   plassoc  = [];

        if (assoc) {
            plassoc = Object.keys(assoc)
                .filter(key => assoc[key] === 'plsql')
                .map(item => item.replace(/^\*./,''));
        }
        return [...new Set([...searchExt ,...plassoc])];
    }

    public static getDocInfos(file: vscode.Uri) {
        const config = vscode.workspace.getConfiguration('plsql-language'),
              enable = <boolean>config.get('pldoc.enable'),
              author = <string>config.get('pldoc.author');

        let location = <string>config.get('pldoc.path');
        if (!location)
            location = path.join(__dirname, '../../snippets/pldoc.json');
        else {
            // const wsFolder = vscode.workspace.getWorkspaceFolder(file);
            // temporary code to resolve bug https://github.com/Microsoft/vscode/issues/36221
            const wsFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(file.fsPath));
            const cwd =  wsFolder ? wsFolder.uri.fsPath : '';
            location = location.replace('${workspaceRoot}', cwd); // deprecated
            location = location.replace('${workspaceFolder}', cwd);
            location = path.join(location, 'pldoc.json');
        }

        return {enable, author, location};
    }

    public static getCompletionPath(wsFolder: vscode.Uri): string {
        const config = vscode.workspace.getConfiguration('plsql-language');

        let location = <string>config.get('completion.path');
        if (location) {
            const cwd =  wsFolder ? wsFolder.fsPath : '';
            // location = location.replace('${workspaceRoot}', cwd); // deprecated
            location = location.replace('${workspaceFolder}', cwd);
            if (location)
                location = path.join(location, 'plsql.completion.json');
        }

        return location;
    }

    // global config
    public static getConnections(): PLSQLConnection[] {
        const config = vscode.workspace.getConfiguration('plsql-language');
        return <PLSQLConnection[]>config.get('connections');
    }

    public static getConnectionPattern(): any {
        const config = vscode.workspace.getConfiguration('plsql-language');
        return {
            patternName: <string>config.get('connection.patternName'),
            patternActiveInfos: <string>config.get('connection.patternActiveInfos')
        };
    }
}
