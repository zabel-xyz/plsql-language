import * as vscode from 'vscode';

import * as fs from 'fs';
import * as json5 from 'json5';

import PLSQLSettings from './plsql.settings';

interface PLSQLCompletionItem  {
    label: string;
    kind: vscode.CompletionItemKind;
    documentation?: string;
}

interface PLSQLCompletionDefinition {
    folder: vscode.Uri;
    members: any; // object of PLSQLCompletionItem[]
    objects?: PLSQLCompletionItem[];
}

/**
 * Controller for handling PLSQLCompletionCustom
 */
export default class PLSQLCompletionCustom {

    private plsqlCompletionDefs: PLSQLCompletionDefinition[] = [];

    constructor() {
    }

    public getCompletion(document: vscode.TextDocument, text?: string): PLSQLCompletionItem[] {

        const completion = this.init(document.uri);
        if (completion)
            if (text)
                return completion.members[text.toLowerCase()];
            else
                return completion.objects;
    }

    private init(file: vscode.Uri): PLSQLCompletionDefinition {

        // Find workspaceFolder corresponding to file
        let folder;
        // const wsFolder = vscode.workspace.getWorkspaceFolder(file);
        // temporary code to resolve bug https://github.com/Microsoft/vscode/issues/36221
        const wsFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(file.fsPath));
        if (wsFolder)
            folder = wsFolder.uri;

        let completionDefs = this.plsqlCompletionDefs.find((value, index, obj) => {
            if (folder && value.folder)
                return (value.folder.fsPath === folder.fsPath);
            else
                return (folder === value.folder);
        });
        if (!completionDefs) {
            completionDefs = this.readJSONFile(folder);
            if (completionDefs)
                this.plsqlCompletionDefs.push(completionDefs);
            else
                this.plsqlCompletionDefs.push({folder: folder, members: {}});
        }
        return completionDefs;
    }

    private readJSONFile(workspacefolder: vscode.Uri): PLSQLCompletionDefinition {
        const location = PLSQLSettings.getCompletionPath(workspacefolder);
        if (!location)
            return;

        let parsedJSON;
        try {
            parsedJSON = json5.parse(fs.readFileSync(location).toString()); // invalid JSON or permission issue can happen here
        } catch (error) {
            console.error(error);
            return;
        }

        const members = {};
        const objects = [];
        Object.keys(parsedJSON).forEach(item => {
            if (parsedJSON[item].members)
                members[item.toLowerCase()] = parsedJSON[item].members.map(
                    member => ({label: member.label, kind: this.convertToCompletionKind(member.kind), documentation: member.documentation}));
            objects.push({label: item, kind: this.convertToCompletionKind(parsedJSON[item].kind), documentation: parsedJSON[item].documentation});
        });

        return {
            folder: workspacefolder,
            objects: objects,
            members: members
        };
    }

    private convertToCompletionKind(kind: string): vscode.CompletionItemKind {
        if (kind)
            kind = kind.toLowerCase();
        switch (kind) {
            case 'class': return vscode.CompletionItemKind.Class;
            case 'color': return vscode.CompletionItemKind.Color;
            case 'constant': return vscode.CompletionItemKind.Constant;
            case 'constructor': return vscode.CompletionItemKind.Constructor;
            case 'enum': return vscode.CompletionItemKind.Enum;
            case 'enumMember': return vscode.CompletionItemKind.EnumMember;
            case 'event': return vscode.CompletionItemKind.Event;
            case 'field': return vscode.CompletionItemKind.Field;
            case 'file': return vscode.CompletionItemKind.File;
            case 'folder': return vscode.CompletionItemKind.Folder;
            case 'function': return vscode.CompletionItemKind.Function;
            case 'interface': return vscode.CompletionItemKind.Interface;
            case 'keyword': return vscode.CompletionItemKind.Keyword;
            case 'method': return vscode.CompletionItemKind.Method;
            case 'module': return vscode.CompletionItemKind.Module;
            case 'operator': return vscode.CompletionItemKind.Operator;
            case 'property': return vscode.CompletionItemKind.Property;
            case 'reference': return vscode.CompletionItemKind.Reference;
            case 'snippet': return vscode.CompletionItemKind.Snippet;
            case 'struct': return vscode.CompletionItemKind.Struct;
            case 'text': return vscode.CompletionItemKind.Text;
            case 'typeParameter': return vscode.CompletionItemKind.TypeParameter;
            case 'unit': return vscode.CompletionItemKind.Unit;
            case 'value': return vscode.CompletionItemKind.Value;
            case 'variable': return vscode.CompletionItemKind.Variable;
            default: return vscode.CompletionItemKind.Text;
        }
    }

}
