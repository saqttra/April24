export enum TokenType{
    // Single char tokens.
    LEFT_PAREN, // '('
    RIGHT_PAREN, // ')'
    LEFT_BRACE, // '{'
    RIGHT_BRACE, // '}'
    COMMA, // ','
    EQUAL, // '='
    SEMICOLON, // ';'
    BINARY_OP, // '+', '-', '*', '/', '%'


    // Literals.
    IDENTIFIER,
    NUMBER,
    // NIL,

    // Keywords.
    LET, CONST, FN, FOR,

    END_OF_FILE,
};

export class Token{
    private value: string | number | null;
    private type : TokenType;
    private line: number;
    private column: number;
    private start: number;
    private end: number;

    constructor(type : TokenType, 
                value : string | number | null,
                line : number,
                column : number,
                start : number, 
                end : number){
        this.type = type;
        this.value = value;
        this.line = line;
        this.column = column;
        this.start = start;
        this.end = end;
    }

    get_value() : string | number | null{ return this.value; }

    get_type() : TokenType{ return this.type; }

    get_line() : number{ return this.line; }

    get_column() : number{ return this.column; }

    get_start(): number { return this.start; }
    
    get_end(): number { return this.end; }
}

// Test token
//const token = new Token(TokenType.NUMBER, "42");
//console.log(token)