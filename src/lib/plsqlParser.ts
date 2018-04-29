import RegExpParser from './regEx/RegExParser';
// import AntlrParser from './Antlr/AntlrParser';

interface PLSQLInfos {
    packageName: string;
    spec?: PLSQLSymbol;
    body?: PLSQLSymbol;
}

interface PLSQLRange {
    start: number;
    end: number;
}

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

    public static findSymbolByNameOffset(symbols: PLSQLSymbol[], name: string, offset = 0, recursive = true): PLSQLSymbol {
        // find first symbol after given offset
        const lower = name.toLowerCase();
        return this.findSymbol(symbols, symbol => (symbol.name.toLowerCase() === lower && symbol.offset >= offset), recursive);
    }

    public static findSymbolNearOffset(symbols: PLSQLSymbol[], offset: number, recursive = true): PLSQLSymbol {
        // find last symbol with offset smaller than given offset
        let nearSymbol;
        this.findSymbol(symbols, (symbol) => {
            const result = (symbol.offset > offset);
            if (!result)
                nearSymbol = symbol;
            return result;
        } , recursive);

        return nearSymbol;
    }

    public static findSymbolByNameKind(symbols: PLSQLSymbol[], name: string, kind: PLSQLSymbolKind|PLSQLSymbolKind[], recursive = true): PLSQLSymbol {
        const lower = name.toLowerCase(),
              kindArray = Array.isArray(kind) ? kind : [kind];
        return this.findSymbol(symbols, symbol => (symbol.name.toLowerCase() === lower && kindArray.includes(symbol.kind)), recursive);
    }

    // Body to Spec and Spec to Body
    public static switchSymbol(symbol: PLSQLSymbol): PLSQLSymbol {
        let kind;
        if (symbol.kind === PLSQLSymbolKind.packageSpec)
            kind = PLSQLSymbolKind.packageBody;
        else if (symbol.kind === PLSQLSymbolKind.packageBody)
            kind = PLSQLSymbolKind.packageSpec;
        else
            return symbol; // not a package
        return this.findSymbolByNameKind(symbol.root.symbols, symbol.name, kind, false);
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
        const root = this.parseFile(fileName, content),
              allSymbols: PLSQLSymbol[] = [];

        this.forEachSymbol(root.symbols, symbol => {
            allSymbols.push(symbol);
        });

        return allSymbols;
    }

    public static getSymbolFileName(symbol: PLSQLSymbol) {
        while (symbol.parent)
            symbol = symbol.parent;
        return symbol.root.fileName;
    }

    private static forEachSymbol(symbols: PLSQLSymbol[], fn) {
        if (symbols)
            symbols.forEach(symbol => {
                fn.apply(this, [symbol]);
                this.forEachSymbol(symbol.symbols, fn);
            });
    }

    private static findSymbol(symbols: PLSQLSymbol[], fn, recursive = true): PLSQLSymbol {
        if (!symbols)
            return;

        let result: PLSQLSymbol;
        for (let symbol of symbols) {
            if (fn.apply(this, [symbol]))
                return symbol;
            if (recursive) {
                result = this.findSymbol(symbol.symbols, fn);
                if (result)
                    return result;
            }
        }
    }

    private static getParser() {
        return RegExpParser;
        // return AntlrParser;
    }
}
