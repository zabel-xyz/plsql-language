import * as assert from 'assert';
import * as vscode from 'vscode';

import * as path from 'path';

// import { PLSQLDefinitionProvider } from '../src/old/plsqlDefinition.provider';
import { PLSQLDefinitionProvider } from '../src/plsqlDefinition.provider';

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
        };
    }

    test('Package', (done) => {
        let testCases: ICase[] = [
            buildCase([36,13], 'get_myValue', [16,2], 'xyz_myPackage.sql'),   // body to spec
            buildCase([25,16], 'set_myValue', [43,2], 'xyz_myPackage.sql'),   // spec to body
            buildCase([36, 6], 'function', [16,2], 'xyz_myPackage.sql'),      // body to spec
            buildCase([25, 6], 'procedure', [43,2], 'xyz_myPackage.sql'),     // spec to body
            buildCase([46,16], 'myCall', [53,2], 'xyz_myPackage.sql'),        // body to body
            buildCase([47,26], 'myCall', [53,2], 'xyz_myPackage.sql'),        // body to body
            buildCase([48,16], 'pCallInternal', [60,2], 'xyz_myPackage.sql'), // body to body
            buildCase([66,16], 'myCall', [19,2], 'xyz_myPackage2.pkb'),       // body to body in another package
            buildCase([67, 6], 'MyFunc', [0,0], 'xyz_myFunc.sql'),            // body to a function file

            buildCase([71,30], 'myConst',      [10,2], 'xyz_myPackage.sql'),  // constant in body to spec (+schema)
            buildCase([72,24], 'myGlobalVar',  [11,2], 'xyz_myPackage.sql'),  // variable in body to spec
            buildCase([62,23], 'txyz_myType',  [3,2],  'xyz_myPackage2.pks'), // type in body to spec in another package
            buildCase([63,13], 'ttxyz_myType', [8,2],  'xyz_myPackage.sql')   // type in body to spec
        ];
        runTest('xyz_myPackage.sql', testCases, done);
    });

    test('Separate package spec', (done) => {
        let testCases: ICase[] = [
            buildCase([22,16], 'set_myValue', [10,2], 'xyz_myPackage2.pkb'),   // spec to body
        ];
        runTest('xyz_myPackage2.pks', testCases, done);
    });

    test('Separate package body I', (done) => {
        let testCases: ICase[] = [
            buildCase([ 3,13], 'get_myValue', [16,2], 'xyz_myPackage2.pks'),    // body to spec
            buildCase([13,16], 'myCall', [19,2], 'xyz_myPackage2.pkb'),        // body to body
            buildCase([14,16], 'pCallInternal', [26,2], 'xyz_myPackage2.pkb'), // body to body
            buildCase([32,16], 'myCall', [53,2], 'xyz_myPackage.sql'),         // body to body in another package
            buildCase([33, 6], 'MyFunc', [0,0], 'xyz_myFunc.sql'),             // body to a function file
            buildCase([34, 6], 'MyProc', [0,0], 'xyz_myProc.sql'),             // body to a procedure file
            buildCase([35,16], 'MyProc', [0,0], 'xyz_myProc.sql')              // body to a procedure file (+schema)
        ];
        runTest('xyz_myPackage2.pkb', testCases, done);
    });

    test('Separate package body II', (done) => {
        let testCases: ICase[] = [
            buildCase([37,30], 'myConst',      [10,2], 'xyz_myPackage2.pks'),      // constant in body to spec (+schema)
            buildCase([38,24], 'myGlobalVar',  [11,2], 'xyz_myPackage2.pks'),      // variable in body to spec
            buildCase([28,23], 'txyz_myType',  [3,2],  'xyz_myPackage.sql'),       // type in body to spec in another package
            buildCase([29,13], 'ttxyz_myType', [8,2],  'xyz_myPackage2.pks')       // type in body to spec
        ];
        runTest('xyz_myPackage2.pkb', testCases, done);
    });

    test('Function', (done) => {
        let testCases: ICase[] = [
            buildCase([18,12], 'myCall', [53,2], 'xyz_myPackage.sql'),         // function to package
            buildCase([19,12], 'MyProc', [0,0], 'xyz_myProc.sql'),             // function to procedure
            buildCase([24,16], 'myNestedFunc', [7,2], 'xyz_myFunc.sql'),       // function to nested function

            buildCase([21,28], 'myConst',      [10,2], 'xyz_myPackage.sql'),      // constant to spec (+schema)
            buildCase([22,24], 'myGlobalVar',  [11,2], 'xyz_myPackage2.pks'),     // variable to spec
            buildCase([14,23], 'txyz_myType',  [3,2],  'xyz_myPackage2.pks'),     // type to spec
            buildCase([15,17], 'ttxyz_myType', [8,2],  'xyz_myPackage.sql')       // type to spec
        ];
        runTest('xyz_myFunc.sql', testCases, done);
    });

    test('Procedure', (done) => {
        let testCases: ICase[] = [
            buildCase([15,12], 'myCall', [53,2], 'xyz_myPackage.sql'),         // procedure to package
            buildCase([16,16], 'MyFunc', [0,0], 'xyz_myFunc.sql'),             // procedure to functiom
            buildCase([17, 6], 'myNestedProc', [6,2], 'xyz_myProc.sql'),       // procedure to nested procedure
        ];
        runTest('xyz_myProc.sql', testCases, done);
    });

    test('Dml', (done) => {
        let testCases: ICase[] = [
            buildCase([1,25], 'set_myValue', [43,2], 'xyz_myPackage.sql'),     // dml to package

            buildCase([12,28], 'myConst',      [10,2], 'xyz_myPackage.sql'),      // constant in dml to spec (+schema)
            buildCase([13,24], 'myGlobalVar',  [11,2], 'xyz_myPackage2.pks'),     // variable in dml to spec
            buildCase([9,23],  'txyz_myType',  [3,2],  'xyz_myPackage2.pks'),     // type in dml to spec
            buildCase([10,17], 'ttxyz_myType', [8,2],  'xyz_myPackage.sql')       // type in dml to spec
        ];
        runTest('xyz_myDml.sql', testCases, done);
    });

});
