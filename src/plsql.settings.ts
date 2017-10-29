import * as vscode from 'vscode';
import * as path from 'path';

/**
 * Settings for plsql.
 */
export default class PLSQLSettings {

    // constructor() {
    // }

    public static getSearchInfos(file: vscode.Uri, searchText: string) {

        // ignore search.exclude settings
        let   ignore;
        const searchExclude = <object>vscode.workspace.getConfiguration('search', file).get('exclude');
        if (searchExclude) {
            ignore = Object.keys(searchExclude).filter(key => searchExclude[key]);
        }

        const config = vscode.workspace.getConfiguration('plsql-language', file);

        // search in specified folder or current workspace
        // const wsFolder = vscode.workspace.getWorkspaceFolder(file);
        // temporary code to resolve bug https://github.com/Microsoft/vscode/issues/36221
        const wsFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(file.fsPath));
        let   cwd =  wsFolder ? wsFolder.uri.fsPath : '';
        const searchFld = <string>config.get('searchFolder');
        if (searchFld) {
            cwd = searchFld.replace('${workspaceRoot}', cwd); // deprecated
            cwd = searchFld.replace('${workspaceFolder}', cwd);
        }

        // fileName = convert packageName
        let   fileName = searchText;
        const replaceSearch = <string>config.get('replaceSearch');
        if (replaceSearch) {
            const regExp = new RegExp(replaceSearch, 'i');
            fileName = fileName.replace(regExp, <string>config.get('replaceValue') || '');
        }

        return {fileName, ignore, cwd};

    }

    public static getDocInfos(file: vscode.Uri) {
        const config = vscode.workspace.getConfiguration('plsql-language', file),
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

}
