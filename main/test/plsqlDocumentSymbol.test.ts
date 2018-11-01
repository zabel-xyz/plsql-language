import * as assert from 'assert';
import * as vscode from 'vscode';

import * as path from 'path';

import { PLSQLDocumentSymbolProvider } from '../src/provider/plsqlDocumentSymbol.provider';

suite('PLSQL Symbols', () => {

    const provider = new PLSQLDocumentSymbolProvider();

    function checkSymbol(symbols, expSymbols) {
        assert.equal(symbols.length, expSymbols.length, '(number of symbols)');
        symbols.forEach((symbol, index) => {
            assert.equal(symbol.name.toLowerCase(), expSymbols[index].name.toLowerCase());
            assert.equal(symbol.kind, expSymbols[index].kind, `(${index}) ${symbol.name.toLowerCase()}`);
            if (symbol.children && expSymbols[index].children)
                checkSymbol(symbol.children, expSymbols[index].children);
            else if (!(!(symbol.children && symbol.children.length) && !expSymbols[index].children))
                assert.ok(false, 'no children symbols');
            // else
                // it's ok, there is no children in both list
        });
    }

    function runTest(file: string, expSymbols, done) {
        const uri = vscode.Uri.file(path.join(vscode.workspace.rootPath, file));
        vscode.workspace.openTextDocument(uri)
            .then(textDocument => {
                const symbols = provider.provideDocumentSymbols(textDocument, null);
                if (symbols) {
                    checkSymbol(symbols, expSymbols);
                } else
                    // no symbols found
                    assert.ok(false, 'Found no symbols');
            }, err => assert.ok(false, `error in OpenTextDocument ${err}`))
            .then(() => done(), done);
    }

    test('Package', (done) => {
        runTest('xyz_myPackage.sql', [
            {name: 'package MyPackage', kind: vscode.SymbolKind.Package,
             children: [
                {name: 'type txyz_myType', kind: vscode.SymbolKind.Struct},
                {name: 'type ttxyz_myType', kind: vscode.SymbolKind.Struct},
                {name: 'constant myConst', kind: vscode.SymbolKind.Constant},
                {name: 'variable myGlobalVar', kind: vscode.SymbolKind.Variable},
                {name: 'function get_myValue', kind: vscode.SymbolKind.Interface},
                {name: 'procedure set_myValue', kind: vscode.SymbolKind.Interface},
                {name: 'procedure myCall', kind: vscode.SymbolKind.Interface}
            ]},
            {name: 'package body MyPackage', kind: vscode.SymbolKind.Package,
             children: [
                {name: 'type txyz_myType2', kind: vscode.SymbolKind.Struct},
                {name: 'type ttxyz_myType2', kind: vscode.SymbolKind.Struct},
                {name: 'constant myConst2', kind: vscode.SymbolKind.Constant},
                {name: 'variable myGlobalVar2', kind: vscode.SymbolKind.Variable},
                {name: 'function pForward', kind: vscode.SymbolKind.Interface},
                {name: 'function get_myValue', kind: vscode.SymbolKind.Function},
                {name: 'procedure set_myValue', kind: vscode.SymbolKind.Method},
                {name: 'procedure myCall', kind: vscode.SymbolKind.Method},
                {name: 'procedure pCallInternal', kind: vscode.SymbolKind.Method},
                {name: 'procedure pMainProcedure', kind: vscode.SymbolKind.Method,
                 children: [
                    {name: 'function pSubFunction', kind: vscode.SymbolKind.Function}
                ]},
                {name: 'function pForward', kind: vscode.SymbolKind.Function}
            ]}
        ], done);
    });

    test('Separate package spec', (done) => {
        runTest('xyz_myPackage2.pks', [
            {name: 'PACKAGE MyPackage2', kind: vscode.SymbolKind.Package,
             children: [
                {name: 'type txyz_myType', kind: vscode.SymbolKind.Struct},
                {name: 'type ttxyz_myType', kind: vscode.SymbolKind.Struct},
                {name: 'constant myConst', kind: vscode.SymbolKind.Constant},
                {name: 'variable myGlobalVar', kind: vscode.SymbolKind.Variable},
                {name: 'function get_myValue', kind: vscode.SymbolKind.Interface},
                {name: 'procedure set_myValue', kind: vscode.SymbolKind.Interface},
                {name: 'procedure myCall', kind: vscode.SymbolKind.Interface}
            ]},
        ], done);
    });

    test('Separate package body', (done) => {
        runTest('xyz_myPackage2.pkb', [
            {name: 'package body MyPackage2', kind: vscode.SymbolKind.Package,
             children: [
                {name: 'function get_myValue', kind: vscode.SymbolKind.Function},
                {name: 'procedure set_myValue', kind: vscode.SymbolKind.Method},
                {name: 'procedure myCall', kind: vscode.SymbolKind.Method},
                {name: 'procedure pCallInternal', kind: vscode.SymbolKind.Method}
            ]},
        ], done);
    });

    test('Function', (done) => {
        runTest('xyz_myFunc.sql', [
            {name: 'FUNCTION MyFunc', kind: vscode.SymbolKind.Function,
             children: [
                {name: 'function myNestedFunc', kind: vscode.SymbolKind.Function},
                {name: 'variable xyz', kind: vscode.SymbolKind.Variable},
                {name: 'variable abc', kind: vscode.SymbolKind.Variable}
            ]},
        ], done);
    });

    test('Procedure', (done) => {
        runTest('xyz_myProc.sql', [
            {name: 'procedure MyProc', kind: vscode.SymbolKind.Method,
             children: [
                {name: 'function myNestedProc', kind: vscode.SymbolKind.Function},
                {name: 'variable x', kind: vscode.SymbolKind.Variable}
            ]},
        ], done);
    });

    test('Dml', (done) => {
        runTest('xyz_myDml.sql', [], done);
    });

});
