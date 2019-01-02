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
    privilege?: string;
    schema?: string;
    active?: boolean;
    loginScript?: string;
    ID?: number;
    name?: string;
    tag?: string;
}

/**
 * Settings for plsql.
 */
export class PLSQLSettings {

    // constructor() {
    // }

    /**
     * SearchPaths:
     * Search in all ws null (default)
     * Search in same ws (${workspaceFolder})
     * Search in specific folder (D:/Path...)
     * Search in specific ws (${workspaceFolder: name|index})
     * Array => ['D:/Path', ${workspaceFolder}]
     */
    public static getSearchInfos(file: vscode.Uri) {
        // ignore search.exclude settings
        let   ignore;
        const searchExclude = <object>vscode.workspace.getConfiguration('search', file).get('exclude');
        if (searchExclude) {
            ignore = Object.keys(searchExclude).filter(key => searchExclude[key]);
        }

        const config = vscode.workspace.getConfiguration('plsql-language');

        let searchFld = <string|Array<string>>config.get('searchPaths');
        if (searchFld) {
            if (!Array.isArray(searchFld))
                searchFld = [searchFld];

            searchFld = searchFld.map(folder => {
                // start with
                // ${workspaceFolder} => current workspace
                // ${workspaceFolder: name} => workspace find by name
                // ${workspaceFolder: index} => workspace find by index
                const match = folder.match(/\${workspaceFolder(?:\s*:\s*(.*))?}/i);
                if (match) {
                    if (vscode.workspace.workspaceFolders && match && match.index === 0) {
                        const wsId = match[1];
                        if (wsId) {
                            const find = vscode.workspace.workspaceFolders.find(ws =>
                                Number.isInteger(<any>wsId - 1) ? ws.index === Number.parseInt(wsId, 10) : ws.name === wsId);
                            if (find)
                                return folder.replace(match[0], find.uri.fsPath);
                        } else {
                            const wsFolder = vscode.workspace.getWorkspaceFolder(file);
                            if (wsFolder)
                                return folder.replace('${workspaceFolder}', wsFolder.uri.fsPath);
                        }
                    }
                    return '';
                };
                return folder;
            }).filter(folder => folder !== '');
        } else if (vscode.workspace.workspaceFolders) // search in all workspaces
            searchFld = vscode.workspace.workspaceFolders.map(ws => ws.uri.fsPath);
        else
            searchFld = [''];

        return {ignore, searchFld};
    }


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
    public static getOracleConnectionEnable(): boolean {
        const config = vscode.workspace.getConfiguration('plsql-language');
        return <boolean>config.get('oracleConnection.enable');
    }

    public static getSearchExt(searchExt: string[]) {

        // copy of package.json
        const DEFAULT_EXT =
             ['sql','ddl','dml','pkh','pks','pkb','pck','pls','plb',
              'bdy','fnc','idx','mv','prc','prg','sch','seq','spc','syn','tab','tbl','tbp','tps','trg','typ','vw'];

        let allExt = [...new Set([...searchExt, ...DEFAULT_EXT])]; // (merge and remove duplicate)

        const config = vscode.workspace.getConfiguration('files', null),
              assoc = <object>config.get('associations');

        if (assoc) {
            const assocExt = [], otherExt = [];
            Object.keys(assoc).forEach(key =>
                (assoc[key] === 'plsql' ? assocExt : otherExt).push(key.replace(/^\*./,'').toLowerCase())
            );
            // Remove ext associated with another language
            if (otherExt.length)
                allExt = allExt.filter(item => otherExt.indexOf(item) === -1);
            // Add ext associated with plsql (remove duplicate)
            if (assocExt.length)
                allExt = [...new Set([...allExt, ...assocExt])];
        }

        return allExt;
    }

    public static getDocInfos(file: vscode.Uri) {
        const config = vscode.workspace.getConfiguration('plsql-language'),
              enable = <boolean>config.get('pldoc.enable'),
              author = <string>config.get('pldoc.author');

        let location = <string>config.get('pldoc.path');
        if (!location)
            location = path.join(__dirname, '../../../snippets/pldoc.json');
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

    public static getEncoding(file: vscode.Uri) {
        const config = vscode.workspace.getConfiguration('files', file);
        return config.get('encoding', 'utf8');
    }
}
