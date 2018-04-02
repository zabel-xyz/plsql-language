// doesn't work => ts to js add .default
// import ParserRuleContext from 'antlr4/ParserRuleContext'; //.ParserRuleContext;
// import PlSqlVisitor from './../../../antlr/grammar/PlSql/PlSqlParserVisitor'; // ).PlSqlParserVisitor;

const ParserRuleContext = require('antlr4/ParserRuleContext').ParserRuleContext;
const PlSqlVisitor = require('./../../../antlr/grammar/PlSql/PlSqlParserVisitor').PlSqlParserVisitor;

/// fix ParserRuleContext.prototype.accept to call visitCustomFunction
ParserRuleContext.prototype.accept = function(visitor) {
    if (visitor instanceof SymbolsVisitor) {
        const name = this.parser.ruleNames[this.ruleIndex];
        const funcName = 'visit' + name.charAt(0).toUpperCase() + name.substr(1);
        return visitor[funcName](this);
    } else
        return visitor.visitChildren(this);
};
///

/**
 * Visitor for symbols list
 */
export default class SymbolsVisitor extends PlSqlVisitor {

    constructor(private list: PLSQLSymbol[]) {
        // @ts-ignore
        super();
    }

    visit(ctx) {
        super.visit(ctx);
    }

    visitCreate_package(ctx) {
        this.createItem(ctx, PLSQLSymbolKind.packageSpec, 'package', ctx.package_name(0).getText());
        return super.visitChildren(ctx);
    }

    visitFunction_spec(ctx) {
        return this.createItem(ctx, PLSQLSymbolKind.function, 'function');
    }

    visitProcedure_spec(ctx) {
        return this.createItem(ctx, PLSQLSymbolKind.procedure, 'procedure');
    }

    visitCreate_package_body(ctx) {
        this.createItem(ctx, PLSQLSymbolKind.packageBody, 'package body', ctx.package_name(0).getText());
        return super.visitChildren(ctx);
    }

    visitFunction_body(ctx) {
        return this.createItem(ctx, PLSQLSymbolKind.function, 'function');
    }

    visitProcedure_body(ctx) {
        return this.createItem(ctx, PLSQLSymbolKind.procedure, 'procedure');
    }

    visitFunction_name(ctx) {
        return this.createItem(ctx, PLSQLSymbolKind.function, 'function', ctx.getText());
    }

    visitProcedure_name(ctx) {
        return this.createItem(ctx, PLSQLSymbolKind.procedure, 'procedure', ctx.getText());
    }

    visitVariable_declaration(ctx) {
        return this.createItem(ctx, PLSQLSymbolKind.variable, 'variable');
    }

    // TODO (for now all is variable ! => change g4 and regenerate)
    visitConstant_declaration(ctx) {
        return this.createItem(ctx, PLSQLSymbolKind.constant, 'constant');
    }

    private createItem(ctx, kind: PLSQLSymbolKind, kindName: string, name?: string) {
        const item = {
            name: name ? name : ctx.identifier().getText(),
            offset: null,
            line: ctx.start.line, // TODO convert line to offset
            kind: kind,
            kindName: kindName,
            symbols: null, // TODO hierarchie
            parent: null,  // TODO hierarchie
            root: null,    // TODO hierarchie
        };
        this.list.push(item);
        return item;
    }
};
