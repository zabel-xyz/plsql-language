interface PLSQLRoot {
    fileName: string;
    symbols: PLSQLSymbol[];
}

interface PLSQLSymbol {
    name: string;
    offset?: number;
    offsetEnd?: number;
    kind: PLSQLSymbolKind;
    kindName: string;
    symbols?: PLSQLSymbol[];
    parent?: PLSQLSymbol;
    root?: PLSQLRoot;
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
    exception
}
