export enum TokenType{
    // Single char tokens.
    LEFT_PAREN, // '('
    RIGHT_PAREN, // ')'
    LEFT_BRACE, // '{'
    RIGHT_BRACE, // '}'
    LEFT_BRACK, // '['
    RIGHT_BRACK, // ']'
    COMMA, // ','
    DOT, // '.'
    COLON, // ':'
    EQUAL, // '='
    SEMICOLON, // ';'
    BINARY_OP, // '+', '-', '*', '/', '%'


    // Literals.
    IDENTIFIER,
    NUMBER,
    // NIL,

    // Keywords.
    LET, CONST, FN,

    END_OF_FILE,
};

export class Token{
    private value: string | number | null;
    private type : TokenType;
    private line: number;
    private column: number;

    constructor(type : TokenType, 
                value : string | number | null,
                line : number,
                column : number){
        this.type = type;
        this.value = value;
        this.line = line;
        this.column = column;
    }

    get_value() : string | number | null{ return this.value; }

    get_type() : TokenType{ return this.type; }

    get_line() : number{ return this.line; }

    get_column() : number{ return this.column; }
}

// Test token
//const token = new Token(TokenType.NUMBER, "42");
//console.log(token)