# Copilot Instructions for plsql-language

## Testing
During testing, always execute npm run test to verify that the typescript compiles without errors. And iterate until there are no errors left. 

## Overview
This repository is a Visual Studio Code extension providing advanced PL/SQL (Oracle) language support. It includes syntax highlighting, symbol navigation, go-to-definition, code completion, documentation generation, and Oracle DB integration.

## Architecture & Key Components
- **main/src/**: Core extension logic, including symbol navigation, definition provider, completion, and controllers.
  - `plsqlNavigator.vscode.ts` and `lib/plsqlNavigator.ts`: Implement "Go to Definition" and symbol navigation. These are performance-critical for Ctrl+Click.
  - `provider/`: Contains VS Code providers for completion, definition, hover, signature help, etc.
  - `connect/`: Handles Oracle DB connection UI and logic.
- **server-oracle/**: Server-side code for Oracle integration.
- **test/**: Test suite and sample PL/SQL files for validation.
- **snippets/**: Default and customizable snippets, including documentation templates.
- **plsql-language-custom/**: Example for custom colorization and extension.

## Developer Workflows
- **Build**: Use `npm run compile` (or `npm run compile:main` / `npm run compile:server-oracle`) to build the extension.
- **Test**: Use `npm run compile:test` to build tests. Tests are in `main/test/`.
- **Publish**: Use `npm run vscode:prepublish` to prepare for publishing.
- **Install dependencies**: Use `npm install` at the root; postinstall scripts will install in submodules.

## Project-Specific Patterns & Conventions
- **PL/SQL file extensions**: Supports a wide range of Oracle-related extensions (see `package.json` > contributes.languages.extensions).
- **Search paths**: Use the `plsql-language.searchPaths` setting to control where symbol search operates. Supports workspace variables and arrays.
- **Custom documentation**: Place your own `pldoc.json` in a custom folder and set `plsql-language.pldoc.path`.
- **Oracle connection**: Enable with `plsql-language.oracleConnection.enable` and configure connections in settings.
- **Keybindings**: `Ctrl+Enter` runs the current query if Oracle connection is enabled.
- **Custom colorization**: See `plsql-language-custom/` for extending syntax highlighting.

## Integration Points
- **VS Code API**: Extension registers language features via `contributes` in `package.json` and implements providers in `main/src/provider/`.
- **Oracle DB**: Connection and query execution logic in `main/src/connect/` and `server-oracle/`.

## Examples
- To optimize "Go to Definition" (Ctrl+Click), review and profile `main/src/plsqlNavigator.vscode.ts` and `main/src/lib/plsqlNavigator.ts`.
- To add a new snippet, edit or add files in `snippets/` and update settings as needed.
- To customize documentation, copy and modify `snippets/pldoc.json` and set the path in settings.

## References
- [README.md](../README.md) for user-facing features and configuration
- [plsql-language-custom/](../plsql-language-custom/) for custom syntax examples

---
If any section is unclear or missing important project-specific details, please provide feedback for further refinement.
