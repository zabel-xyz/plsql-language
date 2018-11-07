interface PLSQLRoot {
    fileName: string;
    symbols: PLSQLSymbol[];
}

interface PLSQLSymbol {
    name: string;
    definition?: string;
    documentation?: string;
    formatedDoc?: {
        isMarkdown: boolean,
        text: string
    };
    offset?: number;
    offsetEnd?: number;
    kind: PLSQLSymbolKind;
    kindName: string;
    params?: PLSQLParam[];
    symbols?: PLSQLSymbol[];
    parent?: PLSQLSymbol;
    root?: PLSQLRoot;
}

interface PLSQLParam {
    text: string;
    name?: string;
    type: string;
    kind: PLSQLParamKind;
}

const enum PLSQLSymbolKind {
    packageSpec = 1,
    packageBody,
    function,
    functionSpec,
    procedure,
    procedureSpec,
    variable,
    constant,
    type,
    subtype,
    cursor,
    exception,
    trigger,
    view,
    table
}

const enum PLSQLParamKind {
    none = 0,
    return,
    in,
    out,
    inout
}
