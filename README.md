# PL/SQL (Oracle) for Visual Studio Code

This extension adds support for the PL/SQL (Oracle) to Visual Studio Code.

## Colorization
Full syntax highlight for PL/SQL files based on oracle-textmate-bundle

An advanced customization can be done by using an **extensionDependencies**, [follow this exemple](plsql-language-custom/xyz.plsql-language-custom-0.0.1)

## Go to Symbol
Navigate
  - to procedures, functions
  - to constants, variables, type, subtype, cursor (declared in spec part of a package)

![Image of Symbol](images/DocumentSymbol.gif)

## Go to Definition
Navigate to methods (procedures and functions) with some limitations :
- Go to a symbol (see Go to Symbol) in the same file
- Go to a symbol (see Go to Symbol) in another file whose name includes the package or method name.
  <br />e.g.: *XXX_MyPackage.pkb or XXX_MyFunction.sql*

![Image of Definition](images/Definition.gif)

## Go to Symbol in workspace
Navigate to methods (procedures and functions) available in your workspace folders with help of an external tool called [ctags](http://ctags.sourceforge.net).

![Image of Symbol in workspace](images/SymbolInWorkspace.gif)

You need to install the ctags tool by putting it somewhere on your local machine and tell the extension where you put it by writing the path to ctags.exe in the extenstion configuration (plsql-language.workspaceSymbols.ctags).

Via extension configuration, you can disable workspace symbols (plsql-language.workspaceSymbols.enable) and configure which files should be scanned during workspace symbols searching phase (plsql-language.workspaceSymbols.extensions). By default files with these extensions will be scanned:
* sql
* pks
* pkb

Workspace symbols index file (used for generating symbols) will be regenerated during extension activation and after every save of a file inside visual studio code. It can also be manually invoked by clicking on the status bar info or by invoking command `Workspace Symbols: Rebuild`.

## Documentation
Generate detailed documentation automatically for procedures and functions.
![Image of Documentation](images/Documentation.gif)

Use Ctrl+Space (like others snippets) when the caret is on an empty line,
above a function or a procedure declaration, a 'special' snippet is generated.
(with prefix __doc by default)

The default template is [here](snippets/pldoc.json).<br />

        plsql-language.pldoc.path:   to define your own snippet and specify its location
        plsql-language.pldoc.author: to define the author.
        plsql-language.pldoc.enable: to disabled this feature

**To customize:**<br>
 - Create your own file pldoc.json.<br>
   Don't change the default file because it'll be overwritten the next time you update this extension
 - Define the path (folder only) to your custom file by using the setting *plsql-language.pldoc.path*

## Snippets
Some snippets available

        plsql-language.snippets.enable: to disabled snippets defined in this extension

## Note
For this extension works with .sql files you must change your settings (user or workspace) like this:

        "files.associations": {
           	"*.sql": "plsql"
        }

## Compile / Task
You can compile a PLSQL package with sqlplus, create a task like this:

        {
            "version": "0.1.0",

            // The command is a shell script
            "isShellCommand": true,

            // Run sqlplus
            "command": "sqlplus",
            // Alternative (see below)
            // "command": "run_sqlplus.bat",

            "args": ["username/password@sid", "@\"${file}\""]
        }

To force sqlplus to complete, it is better to use a batch file like this:

        run_sqlplus.bat
                echo exit | echo show errors | sqlplus %1 %2

This will run sqlplus, output any errors, and then exit cleanly back to VS Code.<br />
Thanks to @mortenbra (issue [#5](https://github.com/zabel-xyz/plsql-language/issues/5))
