interface PLSQLRoot {
    fileName: string;
    symbols: PLSQLSymbol[];
}

interface PLSQLSymbol {
    name: string;
    offset?: number;
    line?: number;
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
    procedure,
    variable,
    constant,
    type,
    subtype,
    cursor,
    exception
}
