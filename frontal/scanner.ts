import { TokenType, Token } from "./token.ts";
import { 
        IllegalCharErr, 
        InvalidBlckCmntStartErrA, 
        InvalidBlckCmntStartErrB 
} from "../error/lexicalError.ts";

declare var Deno: any; // For Deno run environment

// Dictionary of reserved keywords
const keywords: Record<string, TokenType> = {
	"let": TokenType.LET,
    //"nil": TokenType.NIL
    "const": TokenType.CONST,
    "fn" : TokenType.FN,
    "for": TokenType.FOR,
    "while": TokenType.WHILE, 
    "if": TokenType.IF,
    "else": TokenType.ELSE
};

export default class Scanner{
    private srcCode: string;
    private origin : string;
    private scannedTokens : Token[] = [];
    private start: number = 0;
    private currentChar : number = 0;
    private line : number = 1;
    private column : number = 1;

    constructor (srcCode: string, origin: string){
        this.srcCode = srcCode;
        this.origin = origin;
    }
    
    private is_at_eof() : boolean{
        return this.currentChar >= this.srcCode.length;
    }

    private advance() : string{
        this.currentChar++;
        this.column++;
        return this.srcCode.charAt(this.currentChar - 1);
    }

    private add_token(tokType : TokenType, tokValue : string | number | null, line: number, column : number, start: number, end: number) : void{
        // rawSourceCode.substr(start, currentChar - start); -> lexeme
        this.scannedTokens.push(new Token(tokType, tokValue, line, column, start, end));
    }

    //Looks ahead to the next char, but doesn't consume it
    private peek() : string{
        if(this.is_at_eof()){ return '\0'; }
        return this.srcCode.charAt(this.currentChar);
    }

    // Same as peek, but one more char
    private peek_next() : string{
        if(this.currentChar + 1 >= this.srcCode.length){ return '\0'};
        return this.srcCode.charAt(this.currentChar + 1);
    }

    private is_digit(char : string) : boolean{
        return char >= '0' && char <= '9';
    }

    private scan_number() : void {
        // Registra el inicio del número
        let start = this.start;
    
        // Avanza mientras recibas dígitos
        while(this.is_digit(this.peek())){ this.advance(); }
    
        // Maneja números decimales
        if(this.peek() === '.' && this.is_digit(this.peek_next())){
            this.advance(); // Consume el punto '.'
            while(this.is_digit(this.peek())){
                this.advance();
            }
        }
    
        let numberValue : number = parseFloat(this.srcCode.substring(start, this.currentChar));
        this.add_token(TokenType.NUMBER, numberValue, this.line, this.column, start, this.currentChar - 1);
    }
    

    private is_alpha(char : string) : boolean{
        return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || char == '_';
    }

    private is_alphaNumeric(char : string){
        return this.is_alpha(char) || this.is_digit(char);
    }

    private scan_identifier() : void {
        while(this.is_alphaNumeric(this.peek())){ this.advance() };
    
        const lexeme = this.srcCode.substring(this.start, this.currentChar);
        const reserved = keywords[lexeme];
    
        if(typeof reserved === "number") {
            this.scannedTokens.push(new Token(reserved, lexeme, this.line, this.column, this.start, this.currentChar - 1));
            return;
        }
        this.scannedTokens.push(new Token(TokenType.IDENTIFIER, lexeme, this.line, this.column, this.start, this.currentChar - 1));
    }
    

    private get_line_content(lineNumber: number): string {
        let startIdx = this.srcCode.lastIndexOf('\n', this.currentChar - 1) + 1;
        let endIdx = this.srcCode.indexOf('\n', this.currentChar);
        if (endIdx === -1) endIdx = this.srcCode.length;
        return this.srcCode.substring(startIdx, endIdx);
    }

    private scan_token() : void{
        let c = this.advance();
        let blockCommentDepth = 0
        //this.column++;
        switch (c) {
            // Whitespace chars
            case ' ':
            case '\r':
            case '\t':
                break;
            case '\n':
                this.line++;
                this.column = 1;
                break;
            
            // Single-line comments
            case '@':
                while(this.peek() != '\n' && !this.is_at_eof()){
                    this.advance();
                }
                break;

            case '#':
                if(this.is_at_eof()){
                    let lineContent = this.get_line_content(this.line);
                    new InvalidBlckCmntStartErrA(this.origin, this.line, this.column, lineContent).printlnError();
                    Deno.exit(101);
                }

                if(this.peek() !== '|'){
                    let lineContent = this.get_line_content(this.line);
                    new InvalidBlckCmntStartErrB(this.origin, this.line, this.column, lineContent).printlnError();
                    Deno.exit(101);
                }

                // consume '{' to finish consuming "!{" 
                this.advance()
                
                blockCommentDepth += 1;

                while(blockCommentDepth > 0){
                    if(this.peek() == '\n'){
                        this.line += 1;
                        this.column = 0;
                    }

                    this.advance();

                    if(this.peek() == '#' && this.peek_next() == '|'){
                        this.advance()
                        this.advance()
                        blockCommentDepth += 1  
                    }

                    if(this.peek() == '|' && this.peek_next() == '#'){
                        this.advance();
                        this.advance();
                        blockCommentDepth -= 1;
                    }

                    if(this.is_at_eof() && blockCommentDepth > 0){
                        console.error(blockCommentDepth);
                        console.error("Unterminated block comment");
                        Deno.exit(101);
                    }
                }

                break;

            // Single char tokens
            // this.add_token(TokenType.BINARY_OP, this.srcCode.substring(this.start, this.currentChar)); break;
            case '(': this.add_token(TokenType.LEFT_PAREN, c, this.line, this.column, this.start, this.currentChar - 1); break;
            case ')': this.add_token(TokenType.RIGHT_PAREN, c, this.line, this.column, this.start, this.currentChar - 1); break;
            case '{': this.add_token(TokenType.LEFT_BRACE, c, this.line, this.column, this.start, this.currentChar - 1); break;
            case '}': this.add_token(TokenType.RIGHT_BRACE, c, this.line, this.column, this.start, this.currentChar - 1); break;
            case ',': this.add_token(TokenType.COMMA, c, this.line, this.column, this.start, this.currentChar - 1); break;
            // case '=': this.add_token(TokenType.EQUAL, c, this.line, this.column, this.start, this.currentChar - 1); break;
            case ';': this.add_token(TokenType.SEMICOLON, c, this.line, this.column, this.start, this.currentChar - 1); break;
            case '-': 
            case '+':
            case '/':
            case '*': 
            case '%': this.add_token(TokenType.BINARY_OP, c, this.line, this.column, this.start, this.currentChar - 1); break;
            
            case '>':
                if (this.peek() === '=') {
                    this.advance();
                    this.add_token(TokenType.GREATER_EQUAL, ">=", this.line, this.column, this.start, this.currentChar - 1);
                } else {
                    this.add_token(TokenType.GREATER, ">", this.line, this.column, this.start, this.currentChar - 1);
                }
                break;
            case '<':
                if (this.peek() === '=') {
                    this.advance();
                    this.add_token(TokenType.LESS_EQUAL, "<=", this.line, this.column, this.start, this.currentChar - 1);
                } else {
                    this.add_token(TokenType.LESS, "<", this.line, this.column, this.start, this.currentChar - 1);
                }
                break;
            case '=':
                if (this.peek() === '=') {
                    this.advance();
                    this.add_token(TokenType.EQUAL_EQUAL, "==", this.line, this.column, this.start, this.currentChar - 1);
                } else {
                    this.add_token(TokenType.EQUAL, "=", this.line, this.column, this.start, this.currentChar - 1);
                }
                break;
            case '!':
                if (this.peek() === '=') {
                    this.advance();
                    this.add_token(TokenType.NOT_EQUAL, "!=", this.line, this.column, this.start, this.currentChar - 1);
                } else {
                    this.add_token(TokenType.NOT, "!", this.line, this.column, this.start, this.currentChar - 1);
                }
                break;
            case '&':
                if (this.peek() === '&') {
                    this.advance();
                    this.add_token(TokenType.AND, "&&", this.line, this.column, this.start, this.currentChar - 1);
                }
                break;
            case '|':
                if (this.peek() === '|') {
                    this.advance();
                    this.add_token(TokenType.OR, "||", this.line, this.column, this.start, this.currentChar - 1);
                }
                break;

            default:
                // Multichar tokens
                if(this.is_digit(c)){
                    this.scan_number();
                }else if(this.is_alpha(c)){
                    this.scan_identifier();
                }else{
                    let lineContent = this.get_line_content(this.line);
                    new IllegalCharErr(this.origin, this.line, this.column - 1, c, lineContent).printlnError();
                    Deno.exit(100);
                }
                break;
        }
    }

    scan_tokens() : Token[]{
        while(!this.is_at_eof()){ // Scan each token 'til EOF
            // Beginning of the next lexeme
            this.start = this.currentChar;
            this.scan_token();
        }
        
        this.scannedTokens.push(new Token(TokenType.END_OF_FILE, null, this.line, this.column + 1, this.currentChar + 1, this.currentChar + 1));
        return this.scannedTokens;
    }

};

// Test scanner
// const lexer = new Scanner(`let x = 45.2 * (4 / 3)`, "programa.april");
// const lexer = new Scanner("10 - x + y");
// console.log(lexer.scan_tokens());