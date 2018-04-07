/**
 * Parser using regExp
 */
export default class RegExpParser {

    public static regexp: RegExp;

    private static regComment = `(?:\\/\\*[\\s\\S]*?\\*\\/)|(?:--.*)`;
    private static regCommentInside = `(?:\\/\\*[\\s\\S]*?\\*\\/\\s*)?`; // a bit slower !

    private static regSymbolsCreate = `(?:(create)(?:\\s+or\\s+replace)?\\s+)?`;
    private static regSymbols = `(?:\\b(function|procedure|package)\\b(?:\\s+(body))?)\\s+`;
    private static regSymbolsName = `(?:\"?\\w+\"?\\.)?\"?(\\w+)\"?`;

    private static regSpecSymbols = `${RegExpParser.regComment}|(?:(\\w+)\\s+(\\w+)(?:\\s*;|.[^;]*;))`;

    public static initParser(commentInSymbols?: boolean)  {

        const regExpParser =
            `${RegExpParser.regComment}|${RegExpParser.regSymbolsCreate}(?:${RegExpParser.regSymbols}`+
            `${commentInSymbols ? RegExpParser.regCommentInside: ''}`+
            `${RegExpParser.regSymbolsName})`;

        this.regexp = new RegExp(regExpParser, 'gi');
    }

    public static getSymbols(text: string, fileName?: string): PLSQLRoot  {

        if (!this.regexp)
            this.initParser();

        const root: PLSQLRoot = {
            fileName: fileName,
            symbols: []
        };

        let found,
            symbol: PLSQLSymbol,
            parent: PLSQLSymbol;

        while (found = this.regexp.exec(text)) {
            if (found[2]) {
                symbol = {
                    name: found[4],
                    offset: found.index,
                    kindName: found[2] + (found[3] != null ? ' '+found[3] : ''),
                    kind: this.getSymbolKind(found[2].toLowerCase(), found[3] != null)
                };

                if (!parent || found[1]) {
                    symbol.root = root;
                    root.symbols.push(symbol);
                    symbol.symbols = [];
                    parent = symbol;
                } else {
                    symbol.parent = parent;
                    parent.symbols.push(symbol);
                }
            }
        }

        // Extract variables, constants, types from spec part
        root.symbols.forEach((item, index) => {
            if (item.kind === PLSQLSymbolKind.packageSpec) {
                const from = item.offset, // TODO not from => create package...as|is
                      to = index + 1 < root.symbols.length ? root.symbols[index + 1].offset : undefined,
                      search = text.substring(from, to),
                      start = search.search(/(is|as)/i);
                if (start >= 0)
                    this.getSymbolsSpec(search.substring(start + 2), from + start + 2, item);
            }
        });

        return root;
    }

    private static getSymbolsSpec(text: string, offset: number, parent: PLSQLSymbol)  {

        const regexp = new RegExp(this.regSpecSymbols, 'gi');

        let found,
            symbol: PLSQLSymbol;

        // PRAGMA
        // SUBTYPE identifier
        // identifier // variable
        // identifier CONSTANT // constant
        // CURSOR identifier
        // identifier EXCEPTION
        // TYPE identifier
        // PROCEDURE identifier
        // FUNCTION identifier

        let kindName, identifier;
        while (found = regexp.exec(text)) {
            kindName = null;
            if (found[1] && found[2]) {
                if (['subtype', 'cursor', 'type'].includes(found[1].toLowerCase())) {
                    kindName = found[1];
                    identifier = found[2];
                } else if (found[2] && ['constant', 'exception'].includes(found[2].toLowerCase())) {
                    kindName = found[2];
                    identifier = found[1];
                } else if (!(['pragma', 'function', 'procedure', 'create'].includes(found[1].toLowerCase()))) {
                    kindName = 'variable';
                    identifier = found[1];
                }

                if (kindName) {
                    symbol = {
                        name: identifier,
                        offset: found.index + offset,
                        kindName: kindName,
                        kind: this.getSymbolKind(kindName.toLowerCase(), false),
                        parent: parent
                    };
                    parent.symbols.push(symbol);
                }
            }
        }
    }

    private static getSymbolKind(type: string, isBody: boolean): PLSQLSymbolKind  {
        if (type === 'function')
            return PLSQLSymbolKind.function;
        else if (type === 'procedure')
            return PLSQLSymbolKind.procedure;
        else if (type === 'package') {
            if (!isBody)
                return PLSQLSymbolKind.packageSpec;
            else
                return PLSQLSymbolKind.packageBody;
        } else if (type === 'constant')
            return PLSQLSymbolKind.constant;
        else if (type === 'type')
            return PLSQLSymbolKind.type;
        else if (type === 'subtype')
            return PLSQLSymbolKind.subtype;
        else if (type === 'cursor')
            return PLSQLSymbolKind.cursor;
        else if (type === 'exception')
            return PLSQLSymbolKind.exception;
        else
            return PLSQLSymbolKind.variable;
    }
}
