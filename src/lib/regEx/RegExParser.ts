/**
 * Parser using regExp
 */
export default class RegExpParser {

    public static regExp: RegExp;
    public static regExpS: RegExp;
    public static regExpB: RegExp;
    public static regExpJumpEnd: RegExp;
    public static regExpJumpAsIs: RegExp;

    private static regComment = `(?:\\/\\*[\\s\\S]*?\\*\\/)|(?:--.*)`;
    private static regCommentInside = `(?:\\/\\*[\\s\\S]*?\\*\\/\\s*)?`; // a bit slower !

    private static regSymbolsCreate = `(?:(create)(?:\\s+or\\s+replace)?\\s+)?`;
    private static regSymbols = `(?:\\b(function|procedure|package)\\b(?:\\s+(body))?)\\s+`;
    private static regSymbolsName = `(?:\"?\\w+\"?\\.)?\"?(\\w+)\"?`;

    private static regSpecSymbols = `(?:(\\w+)\\s+(\\w+)(?:\\s*;|.[^;]*;))`;
    private static regBody = `(?:\\b(procedure|function)\\b\\s+(\\w+)[\\s\\S]*?(?:(?:\\b(is|as)\\b[\\s\\S]*?)?\\b(begin)\\b|;))`;

    private static regJumpEnd = `(\\bbegin\\b)|(?:(\\bend\\b)\\s*(\\w*)?)`;
    private static regJumpAsIs = `\\b(is|as)\\b`;

    public static initParser(commentInSymbols?: boolean)  {

        const regExpParser =
            `${RegExpParser.regComment}|${RegExpParser.regSymbolsCreate}(?:${RegExpParser.regSymbols}`+
            `${commentInSymbols ? RegExpParser.regCommentInside: ''}`+
            `${RegExpParser.regSymbolsName})`;

        this.regExp = new RegExp(regExpParser, 'gi');
        this.regExpS = new RegExp(`${this.regComment}|${`(\\b(?:end|create)\\b)`}|${this.regSpecSymbols}`, 'gi');
        this.regExpB = new RegExp(`${this.regComment}|${this.regBody}|(\\bbegin\\b)|${this.regSpecSymbols}`, 'gi');
        this.regExpJumpEnd = new RegExp(`${this.regComment}|${this.regJumpEnd}`, 'gi');
        this.regExpJumpAsIs = new RegExp(`${this.regJumpAsIs}`, 'gi');
    }

    public static getSymbols(text: string, fileName?: string): PLSQLRoot  {

        if (!this.regExp)
            this.initParser();

        const root: PLSQLRoot = {
            fileName: fileName,
            symbols: []
        };

        let found,
            symbol: PLSQLSymbol,
            parent: PLSQLSymbol,
            fromOffset, offset = 0;

        // this.regExp.lastIndex = 0;
        while (found = this.regExp.exec(text)) {
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

                // level 1 (create package, proc or func)
                if (parent === symbol) {
                    offset = this.regExp.lastIndex;
                    fromOffset = this.jumpAsIs(text, offset);
                    if (fromOffset !== offset) { // if equal => no is|as => continue on same level...
                        offset = fromOffset;
                        if (symbol.kind === PLSQLSymbolKind.packageSpec)
                            offset = this.getSymbolsSpec(text, offset, symbol);
                        else // symbol.kind in package_body / func / proc
                            offset = this.getSymbolsBody(text, offset, symbol);
                        this.regExp.lastIndex = offset;
                    }
                }
            }
        }

        return root;
    }

    /// (only for spec)
    // PRAGMA
    //
    /// (for spec and body)
    // SUBTYPE identifier
    // identifier // variable
    // identifier CONSTANT // constant
    // CURSOR identifier
    // identifier EXCEPTION
    // TYPE identifier
    // PROCEDURE identifier
    // FUNCTION identifier
    //
    /// (only for body)
    // PROCEDURE identifier Body
    // FUNCTION identifier Body

    private static getSymbolsSpec(text: string, fromOffset: number, parent: PLSQLSymbol): number  {
        let found,
            lastIndex = fromOffset;

        this.regExpS.lastIndex = lastIndex;
        while (found = this.regExpS.exec(text)) {
            if (found[2] && found[3])
                this.createSymbolItem(found[2], found[3], found.index, parent);
            else if (found[1]) // end || create
                break;
            lastIndex = this.regExpS.lastIndex;
        }
        return lastIndex;
    }

    private static getSymbolsBody(text: string, fromOffset: number, parent: PLSQLSymbol): number  {
        let found,
            lastIndex = fromOffset,
            oldIndex;

        this.regExpB.lastIndex = lastIndex;
        while (found = this.regExpB.exec(text)) {
            oldIndex = lastIndex;
            lastIndex = this.regExpB.lastIndex;
            if (found[5])
                break; // found begin without function or procedure => begin of packageBody (or func/proc)
            else if (found[6] && found[7]) {
                if (!this.createSymbolItem(found[6], found[7], found.index, parent)) {
                    // if it's not a symbol, something goes wrong => break
                    lastIndex = oldIndex;
                    break;
                }
            } else if (found[1] && found[2]) {
                // Declare function, procedure => add symbol
                this.createSymbolItem(found[1], found[2], found.index, parent);
                if (found[4]) { // begin
                    // Body => jump to end
                    lastIndex = this.jumpToEnd(text, lastIndex);
                    this.regExpB.lastIndex = lastIndex;
                }
            }
        }
        return lastIndex;
    }

    private static createSymbolItem(text1: string, text2: string, offset: number, parent: PLSQLSymbol): boolean {
        let kindName: string,
            identifier: string,
            symbol: PLSQLSymbol;

        if (text1 && text2) {
            if (['subtype', 'cursor', 'type', 'function', 'procedure'].includes(text1.toLowerCase())) {
                kindName = text1;
                identifier = text2;
            } else if (text2 && ['constant', 'exception'].includes(text2.toLowerCase())) {
                kindName = text2;
                identifier = text1;
            } else if (!(['pragma', 'create', 'end'].includes(text1.toLowerCase()))) {
                // TODO other keyword to avoid variable return...
                kindName = 'variable';
                identifier = text1;
            }

            if (kindName) {
                symbol = {
                    name: identifier,
                    offset: offset,
                    kindName: kindName,
                    kind: this.getSymbolKind(kindName.toLowerCase(), false),
                    parent: parent
                };
                parent.symbols.push(symbol);
                return true;
            }
        }
    }

    private static jumpAsIs(text: string, fromOffset: number): number {
        let match;

        this.regExpJumpAsIs.lastIndex = fromOffset;
        match = this.regExpJumpAsIs.exec(text);
        if (match)
            return this.regExpJumpAsIs.lastIndex;
        return fromOffset;
    }

    private static jumpToEnd(text: string, fromOffset: number): number {
        let match,
            openTokens = 1, // begin was already found
            lastIndex = fromOffset;

        this.regExpJumpEnd.lastIndex = fromOffset;
        while (match = this.regExpJumpEnd.exec(text)) {
            lastIndex = this.regExpJumpEnd.lastIndex;
            if (match[1]) { // begin
                openTokens++;
            } else if (match[2]) { // end
                if (!match[3] || !['case', 'loop', 'if'].includes(match[3].toLowerCase())) {
                    if (openTokens) {
                        openTokens--;
                        if (!openTokens)
                            return lastIndex;
                    } else
                        return lastIndex; // end without begin (error in file !)
                } // else end case|loop|if
            } // else comment => nothing todo
        }
        return lastIndex;
    };

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
