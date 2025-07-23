import '../definition';

/**
 * Parser using regExp
 * (try to parse even with some errors (begin,end,is,as...missing or too much))
 */
export default class RegExpParser {

    public static regExp: RegExp;
    public static regExpS: RegExp;
    public static regExpB: RegExp;
    public static regExpJumpEnd: RegExp;
    public static regExpJumpAsIs: RegExp;
    public static regExpJumpDoc: RegExp;
    public static regExpParams: RegExp;

    private static regComment = `(?:\\/\\*[\\s\\S]*?\\*\\/)|(?:--.*)`;
    private static regCommentDoc = `(?:\\/\\*(\\*)?[\\s\\S]*?\\*\\/)|(?:--.*)`;
    private static regQuote = `(?:["][^"]*["]|['][^']*['])`; //`(?:["'][^"']*["'])`;
    private static regCommentInside = `(?:\\/\\*[\\s\\S]*?\\*\\/\\s*|--.*\\s+)*\\s*`; // a bit slower !
    private static regJumpDoc = `(\\/\\*\\*[\\s\\S]*?\\*\\/)`;

    private static REG_WORD = '[\\w\\$#]';
    private static REG_WORDTYPE = '[\\w\\$#%\\.]'; // param type on the form  xyztable.xyzfield%type
    private static regSymbolsCreate = `(?:(create)(?:\\s+or\\s+replace)?\\s*(?:(?:no\\s+)?force|global\\s+temporary)?\\s*)`;
    private static regSymbols = `(?:\\b(function|procedure|package|trigger|view|table)\\b(?:\\s+(body))?)\\s+`;
    private static regSymbolsName = `(?:\"?${RegExpParser.REG_WORD}+\"?\\.)?\"?(${RegExpParser.REG_WORD}+)\"?`;

    private static regSpecSymbols = `(?:(${RegExpParser.REG_WORD}+)\\s+(\"?${RegExpParser.REG_WORD}+\"?)\\s*(?:\\s*;|.[^;]*;))`;
    private static regSpecCondition = `(?:\\$\\b(?:if|elsif)\\b.*\\s*\\$\\bthen\\b|\\$\\b(?:end|else)\\b)`;
    private static regBody = `(?:\\b(procedure|function)\\b\\s+(\"?${RegExpParser.REG_WORD}+\"?)[\\s\\S]*?((?:\\bas\\s+(language)\\b.[^;]*;)|;|\\b(?:is|as|begin)\\b))`;
    private static regParams = `(?:\\(|,)\\s*((${RegExpParser.REG_WORD}+)\\s*(in\\s+out|in|out)?\\s*(${RegExpParser.REG_WORDTYPE}*))|(?:\\breturn\\b\\s*(${RegExpParser.REG_WORDTYPE}*))`;

    private static regJumpEnd = `(\\b(?:begin|case)\\b)|(?:(\\$?\\bend\\b)\\s*(?:\\b(if|loop|case)\\b)?)`;
    private static regJumpAsIs = `\\b(is|as)\\b`;

    public static initParser(commentInSymbols?: boolean)  {

        const regExpParser =
            `${RegExpParser.regComment}|${RegExpParser.regSymbolsCreate}(?:${RegExpParser.regSymbols}`+
            `${commentInSymbols ? RegExpParser.regCommentInside: ''}`+
            `${RegExpParser.regSymbolsName})`;

        this.regExp = new RegExp(regExpParser, 'gi');
        this.regExpS = new RegExp(`${this.regCommentDoc}|${`(\\b(?:end|create)\\b)`}|${this.regSpecCondition}|${this.regSpecSymbols}`, 'gi');
        this.regExpB = new RegExp(`${this.regCommentDoc}|${this.regBody}|(\\bbegin\\b)|${this.regSpecCondition}|${this.regSpecSymbols}`, 'gi');
        this.regExpJumpEnd = new RegExp(`${this.regComment}|${this.regQuote}|${this.regJumpEnd}`, 'gi');
        this.regExpJumpAsIs = new RegExp(`${this.regJumpAsIs}`, 'gi');
        this.regExpJumpDoc = new RegExp(`${this.regJumpDoc}\\s*$`, 'gi');
        this.regExpParams = new RegExp(`${this.regParams}`, 'gi');
    }

    public static getSymbols(text: string, fileName?: string): PLSQLRoot  {

        if (!this.regExp)
            this.initParser();

        const root: PLSQLRoot = {
            fileName: fileName ?? '',
            symbols: []
        };

        let found: RegExpExecArray | null,
            parent: PLSQLSymbol | undefined = undefined,
            fromOffset: number | undefined, offset = 0;

        this.regExp.lastIndex = 0;
        while ((found = this.regExp.exec(text))) {
            if (found[2]) {
                // package body or create func or create proc
                // create table, view or trigger
                const isBody = (found[3] != null) || (found[1] != null && found[2].toLowerCase() !== 'package');

                const symbol: PLSQLSymbol = {
                    name: found[4],
                    offset: found.index,
                    kindName: found[2] + (found[3] != null ? ' '+found[3] : ''),
                    kind: this.getSymbolKind(found[2].toLowerCase(), isBody),
                    symbols: []
                };

                if (!parent || found[1]) {
                    symbol.root = root;
                    root.symbols.push(symbol);
                    parent = symbol;
                } else {
                    symbol.parent = parent;
                    if (!parent.symbols) parent.symbols = [];
                    parent.symbols.push(symbol);
                }

                if ([ PLSQLSymbolKind.view, PLSQLSymbolKind.trigger, PLSQLSymbolKind.table]
                    .includes(symbol.kind))
                    continue;

                // level 1 (create package, proc or func)
                if (parent === symbol) {
                    offset = this.regExp.lastIndex;
                    fromOffset = this.jumpAsIs(text, offset);
                    if (fromOffset !== offset) { // if equal => no is|as => continue on same level...
                        symbol.definition = found[0] + text.substring(offset, fromOffset-2);
                        offset = fromOffset;
                        if (symbol.kind === PLSQLSymbolKind.packageSpec)
                            offset = this.getSymbolsSpec(text, offset, symbol);
                        else // symbol.kind in package_body / func / proc
                            offset = this.getSymbolsBody(text, offset, symbol);
                        this.regExp.lastIndex = offset;
                        // jumptoend to find real offsetEnd
                        offset = this.jumpToEnd(text, offset);
                        symbol.offsetEnd = offset;
                    }
                }
            }
        }

        return root;
    }

    public static parseParams(symbol: PLSQLSymbol): PLSQLParam[] {
        if (symbol.params && Array.isArray(symbol.params))
            return symbol.params;
        if (!symbol.definition) return [];
        symbol.params = [];
        let found;
        while ((found = this.regExpParams.exec(symbol.definition))) {
            if (found[1])
                symbol.params.push({
                    text: found[1],
                    name: found[2],
                    type: found[4],
                    kind: this.getParamKind(found[3]) // todo: convert
                });
            else if (found[5])
                symbol.params.push({
                    text: found[0],
                    type: found[5],
                    kind: PLSQLParamKind.return
                });
        }
        return symbol.params;
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
            lastIndex = fromOffset,
            lastDoc = null;

        this.regExpS.lastIndex = lastIndex;
        while (found = this.regExpS.exec(text)) {
            if (found[1]) { // doc
                lastDoc = found.index;
                continue;
            }
            else if (found[3] && found[4]) {
                const tempSymbol = this.createSymbolItem(found[3], found[4], found.index, parent, false);
                if (tempSymbol) {
                    tempSymbol.definition = found[0];
                    tempSymbol.offsetEnd = this.regExpS.lastIndex;
                    if (lastDoc != null)
                        tempSymbol.documentation = this.jumpDoc(text, lastDoc, found.index);
                }
            } else if (found[2]) // end || create
                break;
            lastIndex = this.regExpS.lastIndex;
            lastDoc = null;
        }
        return lastIndex;
    }

    private static getSymbolsBody(text: string, fromOffset: number, parent: PLSQLSymbol, extractSymbol = true): number  {
        let found,
            lastIndex = fromOffset,
            lastDoc = null,
            oldIndex;

        this.regExpB.lastIndex = lastIndex;
        while (found = this.regExpB.exec(text)) {
            if (found[1]) { // doc
                lastDoc = found.index;
                continue;
            }
            oldIndex = lastIndex;
            lastIndex = this.regExpB.lastIndex;
            if (found[6]) // begin
                break;
            else if (found[7] && found[8]) {
                if (extractSymbol) {
                    const tempSymbol = this.createSymbolItem(found[7], found[8], found.index, parent, false);
                    if (tempSymbol) {
                        tempSymbol.definition = found[0];
                        tempSymbol.offsetEnd = lastIndex;
                        if (lastDoc != null)
                            tempSymbol.documentation = this.jumpDoc(text, lastDoc, found.index);
                    } else if (found[7].toLowerCase() !== 'pragma') {
                        // if it's not a symbol, something goes wrong => break
                        lastIndex = oldIndex;
                        break;
                    }
                }
            } else if (found[2] && found[3]) { // function, procedure
                // Declare function, procedure => add symbol
                if (!parent.symbols)
                    parent.symbols = [];
                const isBodyBool = !!(found[4] && found[4].toLowerCase() !== ';');
                const tempSymbol = this.createSymbolItem(found[2], found[3], found.index, parent, isBodyBool);
                if (tempSymbol) {
                    tempSymbol.definition = found[0];
                    if (lastDoc != null)
                        tempSymbol.documentation = this.jumpDoc(text, lastDoc, found.index);
                    if (isBodyBool && found[5] !== 'language') {
                        if (found[4] && found[4].toLowerCase() === 'begin') {
                            // begin => jump to end
                        } else { // is,as
                            // read between is and begin (subPro/subFunc)
                            lastIndex = this.getSymbolsBody(text, lastIndex, tempSymbol, false);
                        }
                        // jump to end
                        lastIndex = this.jumpToEnd(text, lastIndex);
                        tempSymbol.offsetEnd = lastIndex;
                        this.regExpB.lastIndex = lastIndex;
                    }
                }
            }
            lastDoc = null;
        }
        return lastIndex;
    }

    private static createSymbolItem(text1: string, text2: string, offset: number, parent: PLSQLSymbol, isBody: boolean): PLSQLSymbol | undefined {
        let kindName: string | undefined = undefined,
            identifier: string | undefined = undefined,
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

            if (kindName && identifier) {
                symbol = {
                    name: identifier,
                    offset: offset,
                    kindName: kindName,
                    kind: this.getSymbolKind(kindName.toLowerCase(), isBody),
                    parent: parent
                };
                if (!parent.symbols) parent.symbols = [];
                parent.symbols.push(symbol);
                return symbol;
            }
        }
        return undefined;
    }

    private static jumpAsIs(text: string, fromOffset: number): number {
        let match;

        this.regExpJumpAsIs.lastIndex = fromOffset;
        match = this.regExpJumpAsIs.exec(text);
        if (match)
            return this.regExpJumpAsIs.lastIndex;
        return fromOffset;
    }

    private static jumpDoc(text: string, fromOffset: number, toOffset: number): string {
        // find doc above a symbol
        let match;

        text = text.substr(0, toOffset);
        this.regExpJumpDoc.lastIndex = fromOffset;
        match = this.regExpJumpDoc.exec(text);
        if (match)
            return match[0];
        return '';
    }

    private static jumpToEnd(text: string, fromOffset: number): number {
        let match,
            openTokens = 1, // begin was already found
            lastIndex = fromOffset;

        this.regExpJumpEnd.lastIndex = fromOffset;
        while (match = this.regExpJumpEnd.exec(text)) {
            lastIndex = this.regExpJumpEnd.lastIndex;
            if (match[1]) { // begin | case
                openTokens++;
            } else if (match[2] && match[2][0] !== '$') { // end | $end
                if (!match[3] || match[3].toLowerCase() === 'case') {
                    if (openTokens) {
                        openTokens--;
                        if (!openTokens)
                            return lastIndex;
                    } else
                        return lastIndex; // end without begin (error in file !)
                } // else end loop|if
            } // else comment, quote => nothing todo
        }
        return lastIndex;
    }

    private static getSymbolKind(type: string, isBody: boolean): PLSQLSymbolKind  {
        if (type === 'function') {
            if (isBody)
                return PLSQLSymbolKind.function;
            else
                return PLSQLSymbolKind.functionSpec;
        } else if (type === 'procedure') {
            if (isBody)
                return PLSQLSymbolKind.procedure;
            else
                return PLSQLSymbolKind.procedureSpec;
        } else if (type === 'package') {
            if (isBody)
                return PLSQLSymbolKind.packageBody;
            else
                return PLSQLSymbolKind.packageSpec;

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
        else if (type === 'trigger')
            return PLSQLSymbolKind.trigger;
        else if (type === 'view')
            return PLSQLSymbolKind.view;
        else if (type === 'table')
            return PLSQLSymbolKind.table;
        else
            return PLSQLSymbolKind.variable;
    }

    private static getParamKind(type: string): PLSQLParamKind {
        if (type === 'in')
            return PLSQLParamKind.in;
        if (type === 'out')
            return PLSQLParamKind.out;
        if (type === 'inout')
            return PLSQLParamKind.inout;
        if (type === 'return')
            return PLSQLParamKind.return;
        else
            return PLSQLParamKind.none;
    }
}
