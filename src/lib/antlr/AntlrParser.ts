// doesn't work => ts to js add .default
// import antlr4 from 'antlr4/index';
// import antlr4Case from './../../../antlr/CaseInsensitiveInputStream';
// import PlSqlParser from './../../../antlr/grammar/PlSql/PlSqlParser';
// import PlSqlLexer from './../../../antlr/grammar/PlSql/PlSqlLexer';

const antlr4 = require('antlr4/index');
const antlr4Case = require('./../../../antlr/CaseInsensitiveInputStream');
const PlSqlParser = require('./../../../antlr/grammar/PlSql/PlSqlParser');
const PlSqlLexer = require('./../../../antlr/grammar/PlSql/PlSqlLexer');

import SymbolsVisitor from './SymbolsVisitor';

/**
 * Parser using antlr
 */
export default class AntlrParser {

    private static lexer;
    private static parser;

    public static getSymbols(text: string, fileName?: string): PLSQLRoot  {
        this.initParser(text);
        const list = [];
        const visitor = new SymbolsVisitor(list);
        visitor.visit(this.parser.sql_script());
        return {
            fileName: fileName,
            symbols: list
        };
    }

    private static initParser(text: string)  {
        const stream = new antlr4.InputStream(text);
        const chars = new antlr4Case.CaseInsensitiveInputStream(stream, true);
        this.lexer = new PlSqlLexer.PlSqlLexer(chars);
        const tokens  = new antlr4.CommonTokenStream(this.lexer);
        this.parser = new PlSqlParser.PlSqlParser(tokens);
        this.parser.buildParseTrees = true;
    }
}
