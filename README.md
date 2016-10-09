## PL/SQL (Oracle) for Visual Studio Code

This extension adds support for the PL/SQL (Oracle) to Visual Studio Code.

#Colorization
Full syntax highlight for PL/SQL files based on oracle-textmate-bundle

#Go to Symbol
Navigate to methods (procedures and functions) inside a package file

![Image of Symbol](https://raw.githubusercontent.com/zabel-xyz/plsql-language/master/Symbol.gif)

#Go to Definition
Navigate to methods (procedures and functions) with some limitations :
- Go to a method in the same file
- Go to a method in another file whose name includes the package or method name.
  e.g.: *XXX_MyPackage.pkb or XXX_MyFunction.sql*

![Image of Definition](https://raw.githubusercontent.com/zabel-xyz/plsql-language/master/Definition.gif)

#Note
For this extension works with .sql files you must change your settings (user or workspace) like this:

        "files.associations": {
           	"*.sql": "plsql"
        }

#Compile / Task
You can compile a PLSQL package with sqlplus, create a task like this:

        {
	        "version": "0.1.0",

            // The command is a shell script
            "isShellCommand": true,

            // Run sqlplus
            "command": "sqlplus",

            "args": ["username/password@sid", "@\"${file}\""]
        }
