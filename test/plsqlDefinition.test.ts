import * as assert from 'assert';
import * as vscode from 'vscode';

import * as path from 'path';

// import { PLSQLDefinitionProvider } from '../src/old/plsqlDefinition.provider';
import { PLSQLDefinitionProvider } from '../src/plsqlDefinition.provider';

interface ICase {
    curTextLine: string;
    curText: string;
    curChar: number;
    expTextLine: string;
    expChar: number;
    expFile: string;
}

suite('PLSQL Definition', () => {

    const provider = new PLSQLDefinitionProvider();

    function runTest(file: string, cases: ICase[], done) {

        const uri = vscode.Uri.file(path.join(vscode.workspace.rootPath, file));
        vscode.workspace.openTextDocument(uri)
            .then(textDocument => {
                return Promise.all(cases.map( (test, index) => {
                    // found line index
                    const found = new RegExp(test.curTextLine, 'i').exec(textDocument.getText());
                    assert.notEqual(found, null, `curText: ${test.curTextLine} not found`);
                    const curPos = textDocument.positionAt(found.index+test.curChar);

                    // run test
                    const num = `(${index}) `;
                    let result;
                    return provider.provideDefinition(textDocument, curPos, null)
                        .then(r => {

                            result = r;
                            const text = textDocument.getText(textDocument.getWordRangeAtPosition(curPos));

                            assert.equal(text, test.curText, num+text);
                            assert.notEqual(result, null, num+'return is null');
                            assert.equal(path.basename(result.uri.fsPath), test.expFile, num+'uri: '+JSON.stringify(result.uri));

                            // OpenTextDocument to find offset...
                            return vscode.workspace.openTextDocument(result.uri);
                        })
                        .then(document => {
                            const match = new RegExp(test.expTextLine, 'i').exec(document.getText());
                            assert.notEqual(match, null, `expText: ${test.expTextLine} not found`);
                            const expPos = document.positionAt(match.index+test.expChar);

                            assert.equal(result.range.start.line, expPos.line, num+'line: '+JSON.stringify(result.range));
                            assert.equal(result.range.start.character, expPos.character, num+'char: '+JSON.stringify(result.range));
                        });
                }));
            }, err => assert.ok(false, `error in OpenTextDocument ${err}`))
            .then(() => done(), done);
    }

    function buildCase(curTextLine: string, curChar: number, curText: string,
                       expTextLine: string, expChar: number, expFile: string): ICase {
        return {
            curChar: curChar,
            curTextLine: curTextLine,
            curText: curText,
            expChar: expChar,
            expTextLine: expTextLine,
            expFile: expFile
        };
    }

    test('Package', (done) => {
        let testCases: ICase[] = [
            // body to spec
            buildCase(
                'function get_myValue\\(param1 in varchar2\\)\\s*return varchar2\\s*is', 14, 'get_myValue',
                'function get_myValue\\(param1 in varchar2\\)\\s*return varchar2;', 0, 'xyz_myPackage.sql'),
            // spec to body
            buildCase(
                'procedure set_myValue\\(param1 in varchar2\\);', 14, 'set_myValue',
                'procedure set_myValue\\(param1 in varchar2\\)\\s*is', 0, 'xyz_myPackage.sql'),
            // body to spec
            buildCase(
                'function get_myValue\\(param1 in varchar2\\)\\s*return varchar2\\s*is', 4, 'function',
                'function get_myValue\\(param1 in varchar2\\)\\s*return varchar2;', 0, 'xyz_myPackage.sql'),
            // spec to body
            buildCase(
                'procedure set_myValue\\(param1 in varchar2\\);', 4, 'procedure',
                'procedure set_myValue\\(param1 in varchar2\\)\\s*is', 0, 'xyz_myPackage.sql'),
            // body to body
            buildCase(
                'MyPackage.myCall\\(\'test\'\\);', 14, 'myCall',
                'procedure myCall\\(param1 in varchar2\\)\\s*is', 0, 'xyz_myPackage.sql'),
            // body to body
            buildCase(
                'schema.MyPackage.myCall\\(\'test2\'\\);', 22, 'myCall',
                'procedure myCall\\(param1 in varchar2\\)\\s*is', 0, 'xyz_myPackage.sql'),
            // body to body
            buildCase(
                'pCallInternal\\(\'test3\'\\);', 5, 'pCallInternal',
                'procedure pCallInternal\\(param1 in varchar2\\)\\s*is', 0, 'xyz_myPackage.sql'),
            // body to body in another package
            buildCase(
                'MyPackage2.myCall\\(\'Test\'\\);', 14, 'myCall',
                'procedure myCall\\(param1 in varchar2\\)\\s*is', 0, 'xyz_myPackage2.pkb'),
            // body to a function file
            buildCase(
                'MyFunc\\(\'Test\'\\);', 3, 'MyFunc',
                'CREATE OR REPLACE FUNCTION MyFunc\\(param1 varchar2\\) return varchar2', 0, 'xyz_myFunc.sql'),

            // constant in body to spec (+schema)
            buildCase(
                'if x = schema.MyPackage.myConst', 26, 'myConst',
                'myConst constant char\\(2\\) := \'10\';', 0, 'xyz_myPackage.sql'),
            // variable in body to spec
            buildCase(
                'if y = myGlobalVar', 15, 'myGlobalVar',
                'myGlobalVar number := 10;', 0, 'xyz_myPackage.sql'),
            // type in body to spec in another package
            buildCase(
                'xyz MyPackage2.txyz_myType;', 20, 'txyz_myType',
                'type txyz_myType is record', 0, 'xyz_myPackage2.pks'),
            // type in body to spec
            buildCase('abc ttxyz_myType;', 13, 'ttxyz_myType',
                      'type ttxyz_myType is table of txyz_myType;', 0, 'xyz_myPackage.sql'),

            // forward declaration body to body declaration
            buildCase(
                'function pForward\\(param1 in varchar2\\)\\s*return varchar2\\s*is', 13, 'pForward',
                'function pForward\\(param1 in varchar2\\)\\s*return varchar2;', 0, 'xyz_myPackage.sql'),
            // forward declaration body declaration to body
            buildCase(
                'function pForward\\(param1 in varchar2\\)\\s*return varchar2;', 13, 'pForward',
                'function pForward\\(param1 in varchar2\\)\\s*return varchar2\\s*is', 0, 'xyz_myPackage.sql'),
            // forward declaration body to body declaration
            buildCase(
                'function pForward\\(param1 in varchar2\\)\\s*return varchar2\\s*is', 4, 'function',
                'function pForward\\(param1 in varchar2\\)\\s*return varchar2;', 0, 'xyz_myPackage.sql'),
            // forward declaration body declaration to body
            buildCase(
                'function pForward\\(param1 in varchar2\\)\\s*return varchar2;', 4, 'function',
                'function pForward\\(param1 in varchar2\\)\\s*return varchar2\\s*is', 0, 'xyz_myPackage.sql'),
            // call to forward declaration
            buildCase(
                'pForward\\(\'test3\'\\);', 5, 'pForward',
                'function pForward\\(param1 in varchar2\\)\\s*return varchar2\\s*is', 0, 'xyz_myPackage.sql'),

            // constant in body to body declaration
            buildCase(
                'if x = myConst2', 12, 'myConst2',
                'myConst2 constant char\\(2\\) := \'10\';', 0, 'xyz_myPackage.sql'),
            // variable in body to body declaration
            buildCase(
                'if y = myGlobalVar2', 15, 'myGlobalVar2',
                'myGlobalVar2 number := 10;', 0, 'xyz_myPackage.sql'),
            // type in body to body declaration
            buildCase('abc ttxyz_myType2;', 13, 'ttxyz_myType2',
                      'type ttxyz_myType2 is table of txyz_myType2;', 0, 'xyz_myPackage.sql')

        ];
        runTest('xyz_myPackage.sql', testCases, done);
    });

    test('Separate package spec', (done) => {
        let testCases: ICase[] = [
            // spec to body
            buildCase(
                'procedure set_myValue\\(param1 in varchar2\\);', 14, 'set_myValue',
                'procedure set_myValue\\(param1 in varchar2\\)\\s*is', 0, 'xyz_myPackage2.pkb'),
        ];
        runTest('xyz_myPackage2.pks', testCases, done);
    });

    test('Separate package body I', (done) => {
        let testCases: ICase[] = [
            // body to spec
            buildCase(
                'function get_myValue\\(param1 in varchar2\\)\\s*return varchar2\\s*is', 13, 'get_myValue',
                'function get_myValue\\(param1 in varchar2\\)\\s*return varchar2;', 0, 'xyz_myPackage2.pks'),
            // body to body
            buildCase(
                'MyPackage2.myCall\\(\'test\'\\);', 13, 'myCall',
                'procedure myCall\\(param1 in varchar2\\)\\s*is', 0, 'xyz_myPackage2.pkb'),
            // body to body
            buildCase(
                'pCallInternal\\(\'test2\'\\);', 5, 'pCallInternal',
                'procedure pCallInternal\\(param1 in varchar2\\)\\s*is', 0, 'xyz_myPackage2.pkb'),
            // body to body in another package
            buildCase(
                'MyPackage.myCall\\(\'Test\'\\);', 12, 'myCall',
                'procedure myCall\\(param1 in varchar2\\)\\s*is', 0, 'xyz_myPackage.sql'),
            // body to a function file
            buildCase(
                'MyFunc\\(\'Test\'\\);', 2, 'MyFunc',
                'CREATE OR REPLACE FUNCTION MyFunc\\(param1 varchar2\\) return varchar2\\s*is', 0, 'xyz_myFunc.sql'),
            // body to a procedure file
            buildCase(
                'MyProc\\(\'Test\'\\);', 2, 'MyProc',
                'CREATE OR REPLACE PROCEDURE "schema".MyProc\\(param1 varchar2\\)\\s*is', 0, 'xyz_myProc.sql'),
            // body to a procedure file (+schema)
            buildCase(
                'schema.MyProc\\(\'Test\'\\);', 9, 'MyProc',
                'CREATE OR REPLACE PROCEDURE "schema".MyProc\\(param1 varchar2\\)\\s*is', 0, 'xyz_myProc.sql'),
        ];
        runTest('xyz_myPackage2.pkb', testCases, done);
    });

    test('Separate package body II', (done) => {
        let testCases: ICase[] = [
            // constant in body to spec (+schema)
            buildCase(
                'if x = schema.MyPackage2.myConst', 27, 'myConst',
                'myConst constant char\\(2\\) := \'10\';', 0, 'xyz_myPackage2.pks'),
            // variable in body to spec
            buildCase(
                'if y = myGlobalVar', 9, 'myGlobalVar',
                'myGlobalVar number := 10;', 0, 'xyz_myPackage2.pks'),
            // type in body to spec in another package
            buildCase(
                'xyz MyPackage.txyz_myType;', 18, 'txyz_myType',
                'type txyz_myType is record\\(', 0, 'xyz_myPackage.sql'),
            // type in body to spec
            buildCase(
                'abc ttxyz_myType;', 10, 'ttxyz_myType',
                'type ttxyz_myType is table of txyz_myType;', 0, 'xyz_myPackage2.pks')
        ];
        runTest('xyz_myPackage2.pkb', testCases, done);
    });

    test('Function', (done) => {
        let testCases: ICase[] = [
            // function to package
            buildCase(
                'myPackage.myCall\\(param1\\);', 12, 'myCall',
                'procedure myCall\\(param1 in varchar2\\)\\s*is', 0, 'xyz_myPackage.sql'),
            // function to procedure
            buildCase(
                'schema.MyProc\\(param1\\);', 9, 'MyProc',
                'CREATE OR REPLACE PROCEDURE "schema".MyProc\\(param1 varchar2\\)', 0, 'xyz_myProc.sql'),
            // function to nested function
            buildCase(
                'return myNestedFunc\\(param1\\);', 9, 'myNestedFunc',
                'function myNestedFunc\\(param1 varchar2\\)', 0, 'xyz_myFunc.sql'),

            // constant to spec (+schema)
            buildCase(
                'if x = schema.MyPackage.myConst', 26, 'myConst',
                'myConst constant char\\(2\\) := \'10\';', 0, 'xyz_myPackage.sql'),
            // variable to spec
            buildCase(
                'if y = MyPackage2.myGlobalVar', 20, 'myGlobalVar',
                'myGlobalVar number := 10;', 0, 'xyz_myPackage2.pks'),
            // type to spec
            buildCase(
                'xyz MyPackage2.txyz_myType;', 19, 'txyz_myType',
                'type txyz_myType is record\\(', 0, 'xyz_myPackage2.pks'),
            // type to spec
            buildCase(
                'abc MyPackage.ttxyz_myType;', 19, 'ttxyz_myType',
                'type ttxyz_myType is table of txyz_myType;', 0, 'xyz_myPackage.sql')
        ];
        runTest('xyz_myFunc.sql', testCases, done);
    });

    test('Procedure', (done) => {
        let testCases: ICase[] = [
            // procedure to package
            buildCase(
                'myPackage.myCall\\(param1\\);', 12, 'myCall',
                'procedure myCall\\(param1 in varchar2\\)\\s*is', 0, 'xyz_myPackage.sql'),
            // procedure to functiom
            buildCase(
                'x := schema.MyFunc\\(param1\\);', 14, 'MyFunc',
                'CREATE OR REPLACE FUNCTION MyFunc\\(param1 varchar2\\) return varchar2', 0, 'xyz_myFunc.sql'),
            // procedure to nested procedure
            buildCase(
                'myNestedProc\\(param1\\);', 2, 'myNestedProc',
                'function myNestedProc\\(param1 varchar2\\)', 0, 'xyz_myProc.sql'),
        ];
        runTest('xyz_myProc.sql', testCases, done);
    });

    test('Dml', (done) => {
        let testCases: ICase[] = [
            // dml to package
            buildCase(
                'set myField = MyPackage.set_myValue\\(\'toto\'\\)', 28, 'set_myValue',
                'procedure set_myValue\\(param1 in varchar2\\)\\s*is', 0, 'xyz_myPackage.sql'),
            // constant in dml to spec (+schema)
            buildCase(
                'if x = schema.MyPackage.myConst', 26, 'myConst',
                'myConst constant char\\(2\\) := \'10\';', 0, 'xyz_myPackage.sql'),
            // variable in dml to spec
            buildCase(
                'if y = MyPackage2.myGlobalVar', 20, 'myGlobalVar',
                'myGlobalVar number := 10;', 0, 'xyz_myPackage2.pks'),
            // type in dml to spec
            buildCase(
                'xyz MyPackage2.txyz_myType;', 20,  'txyz_myType',
                'type txyz_myType is record\\(', 0,  'xyz_myPackage2.pks'),
            // type in dml to spec
            buildCase(
                'abc MyPackage.ttxyz_myType;', 20, 'ttxyz_myType',
                'type ttxyz_myType is table of txyz_myType;', 0,  'xyz_myPackage.sql')
        ];
        runTest('xyz_myDml.sql', testCases, done);
    });

});
