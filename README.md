# PL/SQL (Oracle) for Visual Studio Code

This extension adds support for the PL/SQL (Oracle) to Visual Studio Code.

## Colorization
Full syntax highlight for PL/SQL files based on oracle-textmate-bundle

An advanced customization can be done by using an **extensionDependencies**, [follow this exemple](plsql-language-custom/xyz.plsql-language-custom-0.0.1)

## Go to Symbol
Navigate to methods (procedures and functions) inside a package file

![Image of Symbol](images/DocumentSymbol.gif)

## Go to Definition
Navigate to methods (procedures and functions) with some limitations :
- Go to a method in the same file
- Go to a method in another file whose name includes the package or method name.
  <br />e.g.: *XXX_MyPackage.pkb or XXX_MyFunction.sql*

![Image of Definition](images/Definition.gif)

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
