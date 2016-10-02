import * as assert from 'assert';
import * as vscode from 'vscode';

import * as path from 'path';
import * as fs from 'fs';

import { PLSQLDefinitionProvider } from '../src/plsqlDeclaration.provider';


suite('PLSQL Definition', () => {

    test('Inside same package', (done) => {

        // Example
        // assert.equal(-1, [1, 2, 3].indexOf(5));
        // assert.equal(1, [1, 2, 3].indexOf(5));

        let provider = new PLSQLDefinitionProvider();

        let uri = vscode.Uri.file(path.join(vscode.workspace.rootPath, 'xyz_myPackage.sql'));
        vscode.workspace.openTextDocument(uri).then((textDocument) => {
            let testCases: [vscode.Position, vscode.Position, string, string][] = [
                [new vscode.Position(19, 13), new vscode.Position(5, 2), 'get_myValue', 'xyz_myPackage.sql'],
                [new vscode.Position(11, 16), new vscode.Position(26, 2), 'set_myValue', 'xyz_myPackage.sql'],
            ];
            let promises = testCases.map(([position, expectedPosition, expectedText, expectedFile]) =>
                provider.provideDefinition(textDocument, position, null).then(res => {
                    let text = textDocument.getText(textDocument.getWordRangeAtPosition(position));
                    assert.equal(text, expectedText, text);

                    assert.notEqual(res, null, 'return is null');
                    assert.equal(path.basename(res.uri.fsPath), expectedFile, 'uri: '+JSON.stringify(res.uri));
                    assert.equal(res.range.start.line, expectedPosition.line, 'line: '+JSON.stringify(res.range));
                    assert.equal(res.range.start.character, expectedPosition.character, 'char: '+JSON.stringify(res.range));
                })
            );
            return Promise.all(promises);
        }, (err) => {
             assert.ok(false, `error in OpenTextDocument ${err}`);
        }).then(() => done(), done);
    });


});
