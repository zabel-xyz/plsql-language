## 1.5.0
* New: add Signature help feature. (activated by default) `plsql-language.signatureHelp.enable`
* New: add Hover feature. (desactivated by default) `plsql-language.hover.enable` [#24](https://github.com/zabel-xyz/plsql-language/issues/24)
* Fix bug in regExpParser [#52](https://github.com/zabel-xyz/plsql-language/issues/52)
* Fix bug with characters $# in object name [#53](https://github.com/zabel-xyz/plsql-language/issues/53)

## 1.4.2
* Fix use of Breadcrumbs (add information for end of symbols)

## 1.4.0
* Use new DocumentSymbolClass (according to vscode api documentation) to show hierarchie in outline

## 1.3.4
* Fix issue with parser and nested case...end [#47](https://github.com/zabel-xyz/plsql-language/issues/47)
* Fix issue with the detection of a bad word during auto-completion [#48](https://github.com/zabel-xyz/plsql-language/issues/48)
* Fix issue with outline view [#49](https://github.com/zabel-xyz/plsql-language/issues/49)
* Fix issue with regExParser [#46](https://github.com/zabel-xyz/plsql-language/issues/46)

## 1.3.3
* Fix issues completion is case sensitive [#32](https://github.com/zabel-xyz/plsql-language/issues/32)
* Change priority in auto-completion (1st search in plsql.completion.json) [#44](https://github.com/zabel-xyz/plsql-language/issues/44)
* Fix issue with parser and trimming last character[#45](https://github.com/zabel-xyz/plsql-language/issues/45)
* Fix issue with parser and case...end [#37](https://github.com/zabel-xyz/plsql-language/issues/37)
* Add some keywords in highlight syntax [#34](https://github.com/zabel-xyz/plsql-language/issues/34)

## 1.3.1
* Fix issues completion is case sensitive [#32](https://github.com/zabel-xyz/plsql-language/issues/32)
* Fix issues completion - different icon for symbols [#32](https://github.com/zabel-xyz/plsql-language/issues/32)
* Fix issues completion with loading hangs [#32](https://github.com/zabel-xyz/plsql-language/issues/32)

## 1.3.0
* Fix issues with regExp parser (forward declaration and body declaration) [#37](https://github.com/zabel-xyz/plsql-language/issues/37)
* Add intelliSense for package members (autocompletion from package files) [#32](https://github.com/zabel-xyz/plsql-language/issues/32)
* Add custom intelliSense for tables members (autocompletion from plsql.completion.json) [#32](https://github.com/zabel-xyz/plsql-language/issues/32)

## 1.2.3
* Fix case issue in order to work on Linux [#38](https://github.com/zabel-xyz/plsql-language/issues/38)

## 1.2.2
* Fix case issue in navigation explained here [#35](https://github.com/zabel-xyz/plsql-language/issues/35)
* Fix variable detection explained here [#8](https://github.com/zabel-xyz/plsql-language/issues/8)

## 1.2.1
* Add a setting **commentInSymbols** in order to fix issue [#35](https://github.com/zabel-xyz/plsql-language/issues/35)
* Add a setting **synonym** to use synonym of package name

## 1.2.0
* Refactor parser to consider global constant, variable, type [#8](https://github.com/zabel-xyz/plsql-language/issues/8)

## 1.1.2
* Fix issue with quote character [#31](https://github.com/zabel-xyz/plsql-language/issues/31)

## 1.1.1
* Fix issue with setting searchFolder
* Add a specific variables in PLDoc ${PLDOC_PARAM_TYPE}: type of parameter [#17](https://github.com/zabel-xyz/plsql-language/issues/17)

## 1.1.0
* Fix configuration (brackets, autoClosingPairs) [#29](https://github.com/zabel-xyz/plsql-language/issues/29)
* Add .pls file type [#27](https://github.com/zabel-xyz/plsql-language/issues/27)
* Consider files.associations when search files to navigate
* Support for multi-root workspace
* The minimum supported version of VS Code is now 1.17.0

## 1.0.4
* Fix symbole list (package, procedure, function inside variable name) [#21](https://github.com/zabel-xyz/plsql-language/issues/21)
* Add .pck file type [#18](https://github.com/zabel-xyz/plsql-language/issues/18)

## 1.0.3
* Fix case of module dateformat [#15](https://github.com/zabel-xyz/plsql-language/issues/15)

## 1.0.2
* Fix navigation with schema
* Improve documentation about pldoc

## 1.0.1
* Fix documentation generation not always working [#13](https://github.com/zabel-xyz/plsql-language/issues/13)
* Fix word based suggestions not working

## 1.0.0
* Correct list of symbols with schema in package name [#11](https://github.com/zabel-xyz/plsql-language/issues/11)
* Correct syntax highlighting (rem, prompt) [#10](https://github.com/zabel-xyz/plsql-language/issues/10)
* Add automatic documentation (above functions and procedures)
* Add some snippets
* Use new version of TypeScript, VSCode...

## 0.0.14
* Correct syntax highlighting (user) [#7](https://github.com/zabel-xyz/plsql-language/issues/7)
* Allow to navigate when the cursor is on the keyword function or procedure

## 0.0.13
* Add/Correct syntax highlighting
* Add an exemple for advanced custom colorization

## 0.0.12
* Correct syntax highlighting

## 0.0.10 / 0.0.11
* Correct syntax highlighting, some keywords are too greedy (add,in,...) [#7](https://github.com/zabel-xyz/plsql-language/issues/7)
* Colorize COMMENT keyword

## 0.0.9
* Add some keywords, functions to improve colorization of syntax [#4](https://github.com/zabel-xyz/plsql-language/issues/4)
[#6](https://github.com/zabel-xyz/plsql-language/pull/6)
* Edit README to include a note about running SQLPlus in a task [#5](https://github.com/zabel-xyz/plsql-language/issues/5)

## 0.0.8
* Ignoring names of methods in single-comments [#2](https://github.com/zabel-xyz/plsql-language/issues/2)

## 0.0.7
* Colorize DECLARE keyword [#1](https://github.com/zabel-xyz/plsql-language/issues/1)
* Ignoring names of methods in block-comments
* Use new version of TypeScript, VSCode, vsce...
