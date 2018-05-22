import * as assert from 'assert';
import * as vscode from 'vscode';

import * as path from 'path';

import { PLSQLCompletionItemProvider } from '../src/plsqlCompletionItem.provider';

interface ICase {
    curTextLine: string;
    atBeginning: boolean;
    expCompletion: any[];
}

suite('PLSQL Completion', () => {

    const provider = new PLSQLCompletionItemProvider();

    function runTest(file: string, cases: ICase[], done) {

        const uri = vscode.Uri.file(path.join(vscode.workspace.rootPath, file));
        vscode.workspace.openTextDocument(uri)
            .then(textDocument => {
                return Promise.all(cases.map( (test, index) => {
                    // found line index
                    const regExp = new RegExp(test.curTextLine, 'gi');
                    const found = regExp.exec(textDocument.getText());
                    assert.notEqual(found, null, `curText: ${test.curTextLine} not found`);
                    const curPos = textDocument.positionAt(test.atBeginning ? found.index + 2 : regExp.lastIndex);

                    // run test
                    return provider.provideCompletionItems(textDocument, curPos, null)
                        .then(completion => {
                            if (completion) {
                                test.expCompletion.forEach((expItem) => {
                                    const foundItem = completion.find(item => item.label.toLowerCase() === expItem.text.toLowerCase());
                                    if (!foundItem)
                                        assert.ok(false, `not Found ${expItem.text}`);
                                    assert.equal(foundItem.kind, expItem.kind, `wrong kind ${expItem.text}`);
                                });
                            } else
                                // no completion found
                                assert.ok(false, `Found no completion ${test.curTextLine}`);
                        });
                }));
            }, err => assert.ok(false, `error in OpenTextDocument ${err}`))
            .then(() => done(), done);
    }

    function buildCase(curTextLine: string, atBeginning: boolean, expCompletion: any[]): ICase {
        return {
            atBeginning: atBeginning,
            curTextLine: curTextLine,
            expCompletion: expCompletion
        };
    }

    test('Package', (done) => {
        let testCases: ICase[] = [
            // Object.
            buildCase(
                '-- complete\\s*MyPackage2.', false, [
                    {text: 'txyz_myType', kind: vscode.CompletionItemKind.Struct},
                    {text: 'ttxyz_myType', kind: vscode.CompletionItemKind.Struct},
                    {text: 'myConst', kind: vscode.CompletionItemKind.Constant},
                    {text: 'myGlobalVar', kind: vscode.CompletionItemKind.Variable},
                    {text: 'get_myValue', kind: vscode.CompletionItemKind.Function},
                    {text: 'set_myValue', kind: vscode.CompletionItemKind.Method},
                    {text: 'myCall', kind: vscode.CompletionItemKind.Method}
                ]),
            // Object.Partial member
            buildCase(
                '-- complete\\s*MyPackage2.myV', false, [
                    {text: 'myGlobalVar', kind: vscode.CompletionItemKind.Variable},
                    {text: 'get_myValue', kind: vscode.CompletionItemKind.Function},
                    {text: 'set_myValue', kind: vscode.CompletionItemKind.Method},
                ]),
            // PL_DOC
            buildCase(
                '\\s*procedure set_myValue\\(param1 in varchar2\\)\\s*is', true, [
                    {text: '__doc', kind: vscode.CompletionItemKind.Snippet},
                    {text: 'begin', kind: vscode.CompletionItemKind.Snippet}
                ])
        ];
        runTest('xyz_myPackage.sql', testCases, done);
    });

     test('Separate package body', (done) => {
        let testCases: ICase[] = [
            // Object.
            buildCase(
                '-- complete\\s*MyPackage.', false,
                [
                    {text: 'txyz_myType', kind: vscode.CompletionItemKind.Struct},
                    {text: 'ttxyz_myType', kind: vscode.CompletionItemKind.Struct},
                    {text: 'myConst', kind: vscode.CompletionItemKind.Constant},
                    {text: 'myGlobalVar', kind: vscode.CompletionItemKind.Variable},
                    {text: 'get_myValue', kind: vscode.CompletionItemKind.Function},
                    {text: 'set_myValue', kind: vscode.CompletionItemKind.Method},
                    {text: 'myCall', kind: vscode.CompletionItemKind.Method}
                ]),
            // Object.Partial member
            buildCase(
                '-- complete\\s*MyPackage.myV', false,
                [
                    {text: 'myGlobalVar', kind: vscode.CompletionItemKind.Variable},
                    {text: 'get_myValue', kind: vscode.CompletionItemKind.Function},
                    {text: 'set_myValue', kind: vscode.CompletionItemKind.Method},
                ]),
            // PL_DOC
            buildCase(
                '\\s*procedure set_myValue\\(param1 in varchar2\\)\\s*is', true, [
                    {text: '__doc', kind: vscode.CompletionItemKind.Snippet},
                    {text: 'begin', kind: vscode.CompletionItemKind.Snippet}
                ])
        ];
        runTest('xyz_myPackage2.pkb', testCases, done);
    });
});
