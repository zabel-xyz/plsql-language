import * as vscode from 'vscode'
import { spawn } from 'child_process'
import { ThemeColor } from 'vscode';

const fs = require('fs')
const readline = require('readline')
const fuzzy = require('fuzzy')

export class PLSQLWorkspaceSymbolProvider implements vscode.WorkspaceSymbolProvider {
    provideWorkspaceSymbols(query: string, token: vscode.CancellationToken): Promise<vscode.SymbolInformation[]> {
        return new Promise<vscode.SymbolInformation[]>((resolve, reject) => {
            let tags: vscode.SymbolInformation[] = []

            // got through workspace folders and parse tags file to get workspace symbols
            if (Array.isArray(vscode.workspace.workspaceFolders)) {
                vscode.workspace.workspaceFolders.forEach((workspaceFolder, index) => {
                    const rl = readline.createInterface({
                        input: fs.createReadStream(workspaceFolder.uri.fsPath + '\\tags')
                    })

                    // TODO: Check how to cancel request using the cancellation token
                    // if (token.isCancellationRequested) {
                    //     rl.close()
                    // }

                    rl.on('line', line => {
                        // TODO: Check how to limit result length
                        // if (tags.length > 5) {
                        //     rl.close()
                        // }

                        // ignore ctags special lines
                        if (!line.startsWith('!_')) {
                            const symbol: string[] = line.split('\t')

                            // only get tags that (fuzzy) match user entered query
                            if (fuzzy.test(query, symbol[0])) {                            
                                tags.push(new vscode.SymbolInformation(
                                    symbol[0],
                                    vscode.SymbolKind.Function,
                                    '',
                                    new vscode.Location(vscode.Uri.file(symbol[1]), new vscode.Position(Number(symbol[2].replace(';"', '')) - 1, 0))
                                ))
                            }
                        }
                    })

                    rl.on('close', () => {
                        // after parsing last tags file, resolve workspace symbols
                        if (index === vscode.workspace.workspaceFolders.length - 1) {
                            resolve(tags)
                        }
                    })
                })
            } else {
                reject('Not a workspace')
            }
        })
    }
}

export class WorkspaceSymbols {
    private statusBarItem: vscode.StatusBarItem

    public generate() {
        if (Array.isArray(vscode.workspace.workspaceFolders)) {
            // status bar info
            if (!this.statusBarItem) {
                this.statusBarItem = vscode.window.createStatusBarItem (vscode.StatusBarAlignment.Left, -10)
            }

            // generate tags files
            if (vscode.workspace.getConfiguration('plsql-language').get<string>('workspaceSymbols.ctags')) {
                if (fs.existsSync(vscode.workspace.getConfiguration('plsql-language').get<string>('workspaceSymbols.ctags') + '\\ctags.exe')) {
                    this.statusBarItem.text = '$(search) Generating'
                    this.statusBarItem.color = ThemeColor
                    this.statusBarItem.tooltip = 'Generating workspace symbols...'
                    this.statusBarItem.command = null

                    // go through workspace folders and generate tags file for each folder
                    vscode.workspace.workspaceFolders.forEach((workspaceFolder, index) => {
                        const proc = spawn(
                            vscode.workspace.getConfiguration('plsql-language').get<string>('workspaceSymbols.ctags') + '\\ctags',
                            [
                                '-n',
                                '--recurse',
                                '--langmap=sql:' + vscode.workspace.getConfiguration('plsql-language').get<string>('workspaceSymbols.extensions'),
                                '--fields=k',
                                '--sql-kinds=fp',
                                '--tag-relative'
                            ],
                            {
                                cwd: workspaceFolder.uri.fsPath
                            })

                        proc.stdout.on('data', data => {
                            console.log(`stdout: ${data}`)
                        })

                        proc.stderr.on('data', data => {
                            console.log(`stderr: ${data}`)
                        })

                        // after generating tags files, symbols can be rebuilt through status bar
                        proc.on('close', code => {
                            if (index === vscode.workspace.workspaceFolders.length - 1) {
                                this.statusBarItem.text = '# Rebuild'
                                this.statusBarItem.tooltip = 'Click to rebuild workspace symbols'
                                this.statusBarItem.command = 'extension.rebuildWorkspaceSymbols'
                            }
                        })
                    })
                } else {
                    this.statusBarItem.text = 'ctags not found'
                    this.statusBarItem.color = ThemeColor
                    this.statusBarItem.tooltip = `ctags tool not found in ${vscode.workspace.getConfiguration('plsql-language').get<string>('workspaceSymbols.ctags')}`
                    this.statusBarItem.command = 'extension.rebuildWorkspaceSymbols'                    
                }
            } else {
                this.statusBarItem.text = 'ctags path unknown'
                this.statusBarItem.color = ThemeColor
                this.statusBarItem.tooltip = 'Path to ctags tool not given'
                this.statusBarItem.command = 'extension.rebuildWorkspaceSymbols'              
            }

            this.statusBarItem.show()            
        }
    }

    dispose() {
        this.statusBarItem.dispose();
    }
}