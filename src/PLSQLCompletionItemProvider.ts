import vscode = require('vscode');
export class PLSQLCompletionItemProvider implements vscode.CompletionItemProvider {

    private keywords: vscode.CompletionItem[] = [];
    // private packages: vscode.CompletionItem[] = [];

    public provideCompletionItems(document: vscode.TextDocument, position: vscode.Position,
            token: vscode.CancellationToken): Thenable<vscode.CompletionItem[]> {

        return new Promise<vscode.CompletionItem[]>((resolve, reject) => {

            const lineText = document.lineAt(position.line).text,
                  lineTillCurrentPosition = lineText.substr(0, position.character);

            const regEx = /((?:\w)*)\.((?:\w)*)$/i;

            // Warning collection with '.' !

            let currentWord, pkg, func;

            // console.log('lineText: '+lineText);
            // console.log('lineTillCurrentPosition: '+lineTillCurrentPosition);

            // separate function + package
            const found = regEx.exec(lineTillCurrentPosition);
            if (found) {
                pkg = found[1];
                func = found[2];
                // console.log('in package');
                // console.log('pkg: '+pkg);
                // console.log('func: '+func);
            } else {
                let wordAtPosition = document.getWordRangeAtPosition(position);
                if (wordAtPosition) {
                    currentWord = document.getText(wordAtPosition);
                    // console.log(currentWord);

                    if (!this.keywords.length)
                        this.initKeyWordsList();
                    resolve(this.keywords);
                    return;
                }
                // } else
                    // console.log('none');
            }

            resolve([]);
            // console.log('end');
        });
    }

    private initKeyWordsList() {
        // console.log('init_list');

        const parsedJSON = require('../../syntaxes/plsql.completion.json');

        parsedJSON.keywords.forEach(value => {
                const item: vscode.CompletionItem = new vscode.CompletionItem(value); // UPPER ?
                // item.detail = ; // TODO
                // item.documentation = ; // TODO
                        /* Kind:
                        Class
                            Function
                            Method
                        Keyword
                        */
                item.kind = vscode.CompletionItemKind.Keyword;
                this.keywords.push(item);
            });
        // console.log('parsed');
    }

    // private initPackagesList() {
    //     // this.packages.push();
    // }

}
