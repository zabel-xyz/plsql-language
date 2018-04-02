cd ..\grammar\PlSql

call ..\..\tools\antlr4.bat -Dlanguage=JavaScript -visitor  PlSqlParser.g4
call ..\..\tools\antlr4.bat -Dlanguage=JavaScript -visitor  PlSqlLexer.g4
