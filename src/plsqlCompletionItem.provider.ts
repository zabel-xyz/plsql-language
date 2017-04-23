import * as vscode from 'vscode';
import { PLDocController } from './pldoc.controller';

export class PLSQLCompletionItemProvider implements vscode.CompletionItemProvider {

    private plDocController = new PLDocController();
    private plDocCustomItems: vscode.CompletionItem[];
    private plsqlSnippets:  vscode.CompletionItem[];
    // private plsqlKeyWordItems: vscode.CompletionItem[];

    public provideCompletionItems(document: vscode.TextDocument, position: vscode.Position,
        token: vscode.CancellationToken): Thenable<vscode.CompletionItem[]> {

        return new Promise<vscode.CompletionItem[]>((resolve, reject) => {

            const completeItems: vscode.CompletionItem[] = [];

            const lineText = document.lineAt(position.line).text,
                  text = document.getText(),
                  wordRange = document.getWordRangeAtPosition(position),
                  word = wordRange && document.getText(wordRange);

            // PLDOC
            const plDocItem = this.getPlDocItem(document, position, lineText, text);
            if (plDocItem)
                completeItems.push(plDocItem);

            // PLDOC - custom items
            if (!this.plDocCustomItems)
                this.plDocCustomItems = this.getPlDocCustomItems();
            Array.prototype.push.apply(completeItems, this.filterCompletion(this.plDocCustomItems, word));

            // PLSQL - snippets
            if (!this.plsqlSnippets)
                this.plsqlSnippets = this.getSnippets();
            Array.prototype.push.apply(completeItems, this.filterCompletion(this.plsqlSnippets, word));

            // TODO...
            // Other completion
            /*
            const lineTillCurrentPosition = lineText.substr(0, position.character);
            // TODO: collection with '.' !
            const regEx = /((?:\w)*)\.((?:\w)*)$/i;
            let found;
            if (found = regEx.exec(lineTillCurrentPosition)) {
                Array.prototype.push.apply(completeItems, this.getPackageItems(found[1], found[2]));
            } else {
                // TODO: limit the suggestions useful for the context...
                const wordAtPosition = document.getWordRangeAtPosition(position);
                if (wordAtPosition) {
                    // currentWord = document.getText(wordAtPosition);
                    Array.prototype.push.apply(completeItems, this.getKeyWordItems());
                }
            }
            */

            // completionItems must be filtered and if empty return undefined
            // otherwise word suggestion are lost ! (https://github.com/Microsoft/vscode/issues/21611)
            if (completeItems.length > 0)
                resolve(completeItems);
            else
                resolve();
        });
    }

    private filterCompletion(items: vscode.CompletionItem[], word: string) {
        // completionItems must be filtered and if empty return undefined
        // otherwise word suggestion are lost ! (https://github.com/Microsoft/vscode/issues/21611)
        if (items && word)
            return items.filter(item => item.label.startsWith(word));
        else return [];
    }

    private createSnippetItem(snippet, origin = ''): vscode.CompletionItem {
        return this.createCompleteItem(vscode.CompletionItemKind.Snippet,
                snippet.prefix, snippet.description, snippet.body.join('\n'), origin);
    }

    private createCompleteItem(type: vscode.CompletionItemKind, label: string, doc = '', text = label, origin = ''): vscode.CompletionItem {
        const item = new vscode.CompletionItem(label, type);
        if (type === vscode.CompletionItemKind.Snippet) {
            item.insertText = new vscode.SnippetString(text);
        } else
            item.insertText = text;
        item.documentation = doc;
        item.detail = origin;
        return item;
    }

    private getPlDocItem(document: vscode.TextDocument, position: vscode.Position, lineText: string, text: string): vscode.CompletionItem {
        // Empty line, above a function or procedure
        if ((text !== '') && (lineText.trim() === '') && (document.lineCount > position.line + 1)) {

            const nextPos = new vscode.Position(position.line + 1, 0),
                  nextText = text.substr(document.offsetAt(nextPos));

            const snippet = this.plDocController.getDocSnippet(nextText);
            if (snippet)
                return this.createSnippetItem(snippet, 'pldoc');
        };
    }

    private getPlDocCustomItems(): vscode.CompletionItem[] {
        const snippets = this.plDocController.getCustomSnippets();
        if (snippets)
            return snippets.map(snippet => this.createSnippetItem(snippet));
        return [];
    }

    private getSnippets(): vscode.CompletionItem[] {
        if (vscode.workspace.getConfiguration('plsql-language').get<boolean>('snippets.enable')) {
            const parsedJSON = require('../../snippets/plsql.snippets.json');
            return Object.keys(parsedJSON).map(key => this.createSnippetItem(parsedJSON[key], 'plsql.snippets'));
        }
        return [];
    }

/*
    private getPackageItems(pkg, func): vscode.CompletionItem[] {
        // TODO
        return [];
    }

    private getKeyWordItems(): vscode.CompletionItem[] {
        // TODO : Terminate...
        if (!this.plsqlKeyWordItems) {
            const parsedJSON = require('../../syntaxes/plsql.completion.json');
            return parsedJSON.keywords.map(value => this.createCompleteItem(vscode.CompletionItemKind.Keyword, value));
        }
        return [];
    }
*/
}
