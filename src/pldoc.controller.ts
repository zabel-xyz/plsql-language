import * as vscode from 'vscode';

import * as fs from 'fs';
import * as json5 from 'json5';
import * as dateFormat from 'dateformat';

import { PLSQLSettings } from './plsql.settings';

interface IPlDocObject {
    type: string;
    name: string;
    dataType?: string;
    params?: IPlDocParam[];
}

interface IPlDocParam {
    name: string;
    dataType?: string;
}

interface IPlDocVariablesCustom {
    author: string;
    date: Date;
}

interface IPlDocVariables extends IPlDocVariablesCustom {
    type: string;
    object: string;
}

interface IPlDocVariablesDef {
    regFindVar: RegExp;
    values: IPlDocVariables;
    shift?: number;
    offset?: number;
}

interface IPlDocSnippet {
    prefix: string;
    body: string[];
    description?: string;
}

interface IPlDocTemplate extends IPlDocSnippet {
    paramIndex?: number;
    paramMaxVar?: number;
    paramVarCount?: number;
    returnIndex?: number;
}

/**
 * Controller for handling PlDoc.
 */
export class PLDocController {

    private plDocTemplate: IPlDocTemplate;
    private plDocSnippets: IPlDocSnippet[];
    private plDocAuthor: string;
    private plDocEnable: boolean;

    constructor() {
    }

    public getDocSnippet(document: vscode.TextDocument, text: string): IPlDocSnippet {
        this.init(document.uri);

        if (this.plDocEnable && this.plDocTemplate) {
            let plDocObj = this.getInfo(text);
            if (plDocObj)
                return this.buildTemplate(plDocObj, this.plDocTemplate);
        }
    }

    public getCustomSnippets(document: vscode.TextDocument): IPlDocSnippet[] {
        this.init(document.uri);
        return this.plDocSnippets;
    }

    private init(file: vscode.Uri) {
        // TODO: different plDoc for different workspaceFolders ?
        if (this.plDocEnable == null) {
            const {enable, author, location} = PLSQLSettings.getDocInfos(file);
            this.plDocEnable = enable;
            this.plDocAuthor = author;
            this.initTemplates(location);
        }
    }

    private getRegFindVar(): RegExp {
        return /\$(?:{)?(\d+)/gi;
    }
    private getRegFindVarParam(): RegExp {
        return new RegExp(`\\\${pldoc_${'param'}}`, 'i');
    }
    private getRegFindVarParamType(): RegExp {
        return new RegExp(`\\\${pldoc_${'param_type'}}`, 'i');
    }
    private getRegFindVarDoc(key: string): RegExp {
        return new RegExp(`\\\${pldoc_(${key})(?:(?:\\s*\\|\\s*)([^}]*))?}`, 'i');
    }
    private getRegFindReturn(): RegExp {
        return /\breturn\b/i;  // @return
    }

    private getInfo(text: string): IPlDocObject {
        let plDocObj: IPlDocObject;
        const regex = /(function|procedure)\s*(\w+)\s*(\([\s\S]*?\))?(?:\s*(return))?/i;
        let found = regex.exec(text);
        if (found && found.length > 0) {

            // Function or Procedure
            plDocObj = {
                type: found[1].toLowerCase(),
                name: found[2],
                params: []
            };

            // Params
            const params = found[3],
                  regexParams = /(?:\(|,)\s*(\w+)\s*((?:in\s*out|in|out)?(?:\s*)?\w*)/g;
            if (params !== '') {
                while (found = regexParams.exec(params)) {
                    if (found.length > 0)
                        plDocObj.params.push({name: found[1], dataType: found[2]});
                }
            }
        }

        return plDocObj;
    }

    private initTemplates(location) {

        let parsedJSON;
        try {
            parsedJSON = json5.parse(fs.readFileSync(location).toString()); // invalid JSON or permission issue can happen here
        } catch (error) {
            console.error(error);
            return;
        }

        if (parsedJSON) {

            const variables: IPlDocVariablesCustom = {
                author: this.plDocAuthor,
                date: new Date()
            };

            Object.keys(parsedJSON).forEach(key => {
                // Doc
                if (key === 'pldoc') {
                    if (this.plDocEnable && parsedJSON.pldoc.body) {
                        this.plDocTemplate = parsedJSON.pldoc;
                        this.addTemplateInfo(this.plDocTemplate);
                    }
                    else
                        this.plDocTemplate = null;
                } else { // Other custom snippet
                    const snippet = parsedJSON[key];
                    snippet.body.forEach( (text, index) =>
                        snippet.body[index] = this.replaceText(variables, text)
                    );
                    if (!this.plDocSnippets)
                        this.plDocSnippets = [];
                    this.plDocSnippets.push(snippet);
                }
            });
        }
    }

    private addTemplateInfo(template: IPlDocTemplate) {

        // Find index of params line
        const regFindParam = this.getRegFindVarParam(),
              regFindVar = this.getRegFindVar(),
              regFindReturn = this.getRegFindReturn();

        let found;
        template.body.forEach( (text, index) => {
            if (template.paramIndex == null) {
                found = regFindParam.exec(text);
                if (found) {
                    template.paramIndex = index;
                    template.paramMaxVar = 0;
                    template.paramVarCount = 0;
                    let foundVar, numberVar = 0;
                    while (foundVar = regFindVar.exec(text)) {
                        ++template.paramVarCount;
                        numberVar = Number(foundVar[1]);
                        if (template.paramMaxVar < numberVar)
                            template.paramMaxVar = numberVar;
                    }
                }
            }
            if (template.returnIndex == null) {
                found = regFindReturn.exec(text);
                if (found)
                    template.returnIndex = index;
            }
        });
    }

    private buildTemplate(plDocObj: IPlDocObject, template: IPlDocTemplate): IPlDocTemplate  {
        let body: string[] = [];

        const variables: IPlDocVariablesDef = {
            regFindVar: this.getRegFindVar(),
            values: {
                type: plDocObj.type,
                object: plDocObj.name,
                author: this.plDocAuthor,
                date: new Date()
            },
            shift: plDocObj.params.length > 1 ? (plDocObj.params.length - 1)*template.paramVarCount : 0,
            offset: template.paramMaxVar
        };

        template.body.forEach( (text, index) => {
            let lineText = text;
            if (index !== template.paramIndex) {
                if (index !== template.returnIndex || plDocObj.type === 'function') {
                    lineText = this.replaceText(variables.values, lineText);
                    lineText = this.shiftVariables(variables, lineText, template);
                    body.push(lineText);
                }
            } else {
                plDocObj.params.forEach( (param, paramIndex) => {
                    let paramText = lineText;
                    paramText = this.replaceTextParam(param, paramText);
                    if (paramIndex > 0)
                        paramText = this.shiftParamVariables(variables, paramText);
                    body.push(paramText);
                });
            }
        });

        if (body.length > 0)
            return {
                prefix: template.prefix,
                body: body,
                description: template.description
            };
    }

    private replaceText(variables: IPlDocVariablesCustom, text: string): string {
        // replace special variables values
        Object.keys(variables).forEach(key => {
            text = text.replace(this.getRegFindVarDoc(key), (match, p1, p2) => {
                if (!p1 || (p1.toLowerCase() !== 'date'))
                    return variables[key];
                else {
                    // replace date
                    if (!p2 || (p2.trim() === ''))
                        return variables.date.toLocaleDateString();
                    else
                        return dateFormat(variables.date, p2);
                }
            });
        });
        return text;
    }

    private shiftVariables(variables: IPlDocVariablesDef, text: string, template: IPlDocTemplate): string {
        if (variables.shift > 0) {
            text = text.replace(variables.regFindVar, (match, p1) => {
                if (Number(p1) > template.paramMaxVar) {
                    // Shift variables $n or ${n:xxx}
                    if (match.startsWith('${'))
                        return '${'+String(variables.shift+Number(p1));
                    else //if (match.startsWith('$'))
                        return '$'+String(variables.shift+Number(p1));
                } else
                    return match;
            });
        }
        return text;
    }

    private replaceTextParam(param: IPlDocParam, text: string): string {
        // replace special variables values
        return text.replace(this.getRegFindVarParam(), param.name)
                   .replace(this.getRegFindVarParamType(), param.dataType);
    }

    private shiftParamVariables(variables: IPlDocVariablesDef, text: string): string {
        if (variables.offset != null) {
            text = text.replace(variables.regFindVar, (match, p1) => {
                // Shift variables $n or ${n:xxx}
                if (match.startsWith('${'))
                    return '${'+String(++variables.offset);
                else //if (match.startsWith('$'))
                    return '$'+String(++variables.offset);
            });
        }
        return text;
    }
}
