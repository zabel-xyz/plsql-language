import * as assert from 'assert';
import * as vscode from 'vscode';

import * as path from 'path';

import { PLSQLDefinitionProvider } from '../src/plsqlDeclaration.provider';

interface ICase {
    currPos: vscode.Position;
    currText: string;
    expectedPos: vscode.Position;
    expectedFile: string;
}

suite('PLSQL Definition', () => {

    const provider = new PLSQLDefinitionProvider();

    function runTest(file: string, cases: ICase[], done) {

        let uri = vscode.Uri.file(path.join(vscode.workspace.rootPath, file));
        vscode.workspace.openTextDocument(uri).then((textDocument) => {
            let promises = cases.map( (test, index) =>
                provider.provideDefinition(textDocument, test.currPos, null).then(res => {
                    let num = `(${index}) `;
                    let text = textDocument.getText(textDocument.getWordRangeAtPosition(test.currPos));
                    assert.equal(text, test.currText, num+text);

                    assert.notEqual(res, null, num+'return is null');
                    assert.equal(path.basename(res.uri.fsPath), test.expectedFile, num+'uri: '+JSON.stringify(res.uri));
                    assert.equal(res.range.start.line, test.expectedPos.line, num+'line: '+JSON.stringify(res.range));
                    assert.equal(res.range.start.character, test.expectedPos.character, num+'char: '+JSON.stringify(res.range));
                })
            );
            return Promise.all(promises);
        }, (err) => {
             assert.ok(false, `error in OpenTextDocument ${err}`);
        }).then(() => done(), done);
    }

    function buildCase(currPos: number[], currText: string, expPos: number[], expFile: string): ICase {
        return {
            currPos: new vscode.Position(currPos[0], currPos[1]),
            currText: currText,
            expectedPos: new vscode.Position(expPos[0], expPos[1]),
            expectedFile: expFile
        }
    }

    test('Inside same package', (done) => {
        let testCases: ICase[] = [
            buildCase([21,13], 'get_myValue', [5,2], 'xyz_myPackage.sql'),   // body to spec
            buildCase([11,16], 'set_myValue', [28,2], 'xyz_myPackage.sql'),  // spec to body
            buildCase([31,16], 'callTo', [37,2], 'xyz_myPackage.sql'),       // body to body
            buildCase([32,16], 'pCallInternal', [44,2], 'xyz_myPackage.sql') // body to body
        ];
        runTest('xyz_myPackage.sql', testCases, done);
    });

    test('Separate spec/body', (done) => {
        let testCases: ICase[] = [
            buildCase([11,16], 'set_myValue', [10,2], 'xyz_myPackage2.pkb'),      // spec to body
        ]
        runTest('xyz_myPackage2.pks', testCases, done);
    });
    test('Separate body/spec', (done) => {
        let testCases: ICase[] = [
            buildCase([3,13], 'get_myValue', [5,2], 'xyz_myPackage2.pks'),       // body to spec
            buildCase([13,16], 'callTo', [19,2], 'xyz_myPackage2.pkb'),           // body to body
            buildCase([14,16], 'pCallInternal', [26,2], 'xyz_myPackage2.pkb')     // body to body
        ];
        runTest('xyz_myPackage2.pkb', testCases, done);
    });

    // TODO :
    // package to another one
    // package to procedure
    // procedure to package
    // dmt to package
    // function to nested function

});
