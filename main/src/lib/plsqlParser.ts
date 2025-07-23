import RegExpParser from './regEx/RegExParser';
import DocFormater from './docFormater';
import './definition';



export default class PlSqlParser {

    public static initParser(symbolsComment?: boolean)  {
        this.getParser().initParser(symbolsComment);
    }

    public static parseFile(fileName: string, content: string): PLSQLRoot {
        const root = this.getParser().getSymbols(content);
        if (root)
            root.fileName = fileName;
        return root;
    }

    public static parseParams(symbol: PLSQLSymbol): PLSQLParam[] {
        return this.getParser().parseParams(symbol);
    }

    public static findSymbolByNameOffset(symbols: PLSQLSymbol[], name: string, offset = 0, recursive = true): PLSQLSymbol | undefined {
        // find first symbol after given offset
        const lower = name.toLowerCase();
        return this.findSymbol(symbols, (symbol: PLSQLSymbol) => (symbol.name.toLowerCase() === lower && symbol.offset !== undefined && symbol.offset >= offset), recursive);
    }

    public static findSymbolNearOffset(symbols: PLSQLSymbol[], offset: number, recursive = true): PLSQLSymbol | undefined {
        // find last symbol with offset smaller than given offset
        let nearSymbol: PLSQLSymbol | undefined = undefined;
        this.findSymbol(symbols, (symbol: PLSQLSymbol) => {
            const result = (symbol.offset !== undefined && symbol.offset > offset);
            if (!result)
                nearSymbol = symbol;
            return result;
        } , recursive);
        return nearSymbol;
    }

    public static findSymbolByNameKind(symbols: PLSQLSymbol[], name: string, kind: PLSQLSymbolKind|PLSQLSymbolKind[], recursive = true): PLSQLSymbol | undefined {
        const lower = name.toLowerCase();
        const kindArray = Array.isArray(kind) ? kind : [kind];
        return this.findSymbol(symbols, (symbol: PLSQLSymbol) => (symbol.name.toLowerCase() === lower && kindArray.includes(symbol.kind)), recursive);
    }

    public static getSymbolsDeclaration(root: PLSQLRoot): PLSQLSymbol[] {
        const allSymbols: PLSQLSymbol[] = [];
        this.forEachSymbol(root.symbols, (symbol: PLSQLSymbol) => {
            if (![PLSQLSymbolKind.function, PLSQLSymbolKind.procedure,
                PLSQLSymbolKind.packageBody, PLSQLSymbolKind.packageSpec].includes(symbol.kind))
                allSymbols.push(symbol);
        });
        return allSymbols;
    }

    // Body to Spec and Spec to Body
    public static switchSymbol(symbol: PLSQLSymbol): PLSQLSymbol | undefined {
        let kind: PLSQLSymbolKind | undefined;
        if (symbol.kind === PLSQLSymbolKind.packageSpec)
            kind = PLSQLSymbolKind.packageBody;
        else if (symbol.kind === PLSQLSymbolKind.packageBody)
            kind = PLSQLSymbolKind.packageSpec;
        else
            return symbol; // not a package
        if (symbol.root && symbol.root.symbols)
            return this.findSymbolByNameKind(symbol.root.symbols, symbol.name, kind, false);
        return undefined;
    }

    // Body to Spec and Spec to Body
    public static switchSymbolKind(symbolKind: PLSQLSymbolKind): PLSQLSymbolKind {
        if (symbolKind === PLSQLSymbolKind.functionSpec)
            return PLSQLSymbolKind.function;
        else if (symbolKind === PLSQLSymbolKind.function)
            return PLSQLSymbolKind.functionSpec;
        else if (symbolKind === PLSQLSymbolKind.procedureSpec)
            return PLSQLSymbolKind.procedure;
        else if (symbolKind === PLSQLSymbolKind.procedure)
            return PLSQLSymbolKind.procedureSpec;
        else if (symbolKind === PLSQLSymbolKind.packageSpec)
            return PLSQLSymbolKind.packageBody;
        else if (symbolKind === PLSQLSymbolKind.packageBody)
            return PLSQLSymbolKind.packageSpec;
        else
            return symbolKind;
    }

    public static isSymbolSpec(symbol: PLSQLSymbol): boolean {
        return [PLSQLSymbolKind.packageSpec, PLSQLSymbolKind.procedureSpec, PLSQLSymbolKind.functionSpec]
            .includes(symbol.kind);
    }

    public static getSymbols(fileName: string, content: string): PLSQLSymbol[] {
        return this.getSymbolsFromRoot(this.parseFile(fileName, content));
    }

    public static getSymbolsFromRoot(root: PLSQLRoot): PLSQLSymbol[] {
        const allSymbols: PLSQLSymbol[] = [];

        this.forEachSymbol(root.symbols, symbol => {
            allSymbols.push(symbol);
        });

        return allSymbols;
    }

    public static getSymbolFileName(symbol: PLSQLSymbol): string | undefined {
        while (symbol.parent)
            symbol = symbol.parent;
        return symbol.root ? symbol.root.fileName : undefined;
    }

    public static formatSymbolDocumentation(symbol: PLSQLSymbol, useJSDoc: boolean): void {
        if (symbol.documentation && !symbol.formatedDoc) {
            symbol.formatedDoc = {
                text: DocFormater.format(symbol.documentation, useJSDoc),
                isMarkdown: useJSDoc
            };
        }
    }

    private static forEachSymbol(symbols: PLSQLSymbol[] | undefined, fn: (symbol: PLSQLSymbol) => void): void {
        if (symbols)
            symbols.forEach((symbol: PLSQLSymbol) => {
                fn.apply(this, [symbol]);
                this.forEachSymbol(symbol.symbols, fn);
            });
    }

    private static findSymbol(symbols: PLSQLSymbol[] | undefined, fn: (symbol: PLSQLSymbol) => boolean, recursive = true): PLSQLSymbol | undefined {
        if (!symbols)
            return undefined;
        let result: PLSQLSymbol | undefined = undefined;
        for (let symbol of symbols) {
            if (fn.apply(this, [symbol]))
                return symbol;
            if (recursive) {
                result = this.findSymbol(symbol.symbols, fn);
                if (result)
                    return result;
            }
        }
        return undefined;
    }

    private static getParser() {
        return RegExpParser;
        // return AntlrParser;
    }
}
