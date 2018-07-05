# PL/SQL (Oracle) for Visual Studio Code

This extension adds support for the PL/SQL (Oracle) to Visual Studio Code.

## Colorization
Full syntax highlight for PL/SQL files based on oracle-textmate-bundle

An advanced customization can be done by using an **extensionDependencies**, [follow this exemple](plsql-language-custom/xyz.plsql-language-custom-0.0.1)

## Go to Symbol
Navigate
  - to procedures, functions
  - to constants, variables, type, subtype, cursor (declared in spec/body part of a package)

![Image of Symbol](images/DocumentSymbol.gif)

## Go to Definition
Navigate to methods (procedures and functions) with some limitations :
- Go to a symbol (see Go to Symbol) in the same file
- Go to a symbol (see Go to Symbol) in another file whose name includes the package or method name.
  <br />e.g.: *XXX_MyPackage.pkb or XXX_MyFunction.sql*

![Image of Definition](images/Definition.gif)

## Documentation
Generate detailed documentation automatically for procedures and functions.
![Image of Documentation](images/Documentation.gif)

Use Ctrl+Space (like others snippets) when the caret is on an empty line,
above a function or a procedure declaration, a 'special' snippet is generated.
(with prefix __doc by default)

The default template is [here](snippets/pldoc.json).<br />
(don't modify this file, it'll be overwritten with the update of the extension !)<br />

        plsql-language.pldoc.path:   to define your own snippet and specify its location
        plsql-language.pldoc.author: to define the author.
        plsql-language.pldoc.enable: to disabled this feature

**To customize:**<br>
 - Create your own file pldoc.json.<br>
   Don't change the default file because it'll be overwritten the next time you update this extension
 - Define the path (folder only) to your custom file by using the setting *plsql-language.pldoc.path*

## Completion
There is intelliSense for package members (autocompletion from package files).

You can also define your own completion for tables/fields.
An exemple is [here](snippets/plsql.completion.json).<br />
(don't use this file, it'll be overwritten with the update of the extension !)<br />

        plsql-language.completion.path: to specify its location

## Snippets
Some snippets available

        plsql-language.snippets.enable: to disabled snippets defined in this extension

## Note
For this extension works with .sql files you must change your settings (user or workspace) like this:

        "files.associations": {
           	"*.sql": "plsql"
        }

## Connection
Currently there is **no automatic connection**.

You can configure a list of connection in settings and use the active one in your tasks (see below).
Use the command: `PLSQL - Activate connection`

This is the first step, roadmap:
- [X] List of connections in settings.
- [ ] Complete fields list in settings (host, port, sid, connect as...)
- [ ] Connect to DB
- [ ] Execute SQL
- [ ] Run as a script
- [ ] Auto-complete

## Compile / Task
You can compile a PLSQL package with sqlplus, create a task like this:

        {
                "version": "2.0.0",
                "tasks": [{
                        "label": "sqlplus",
                        // Run sqlplus
                        "command": "sqlplus",
                        // Alternative (see below)
                        // "command": "run_sqlplus.bat",

                        "args": ["username/password@sid", "@\"${file}\""]
                        // Alternative: use active connection defined in settings
                        // "args": [${config:plsql-language.connection.activeInfos}, "@\"${file}\""]
                }]
        }

To force sqlplus to complete, it is better to use a batch file like this:

        run_sqlplus.bat
                echo exit | echo show errors | sqlplus %1 %2

This will run sqlplus, output any errors, and then exit cleanly back to VS Code.<br />
Thanks to @mortenbra (issue [#5](https://github.com/zabel-xyz/plsql-language/issues/5))
