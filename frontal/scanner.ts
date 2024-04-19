import { TokenType, Token } from "./token.ts";
import { IllegalCharErr } from "../error/lexicalError.ts";

declare var Deno: any; // For Deno run environment

// Dictionary of reserved keywords
const keywords: Record<string, TokenType> = {
	"let": TokenType.LET,
    //"nil": TokenType.NIL
    "const": TokenType.CONST,
    "fn" : TokenType.FN
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

    private add_token(tokType : TokenType, tokValue : string | number | null) : void{
        // rawSourceCode.substr(start, currentChar - start); -> lexeme
        // this.scannedTokens.push(new Token(tokType, tokValue, this.line, this.column - (this.currentChar - this.start)));
        this.scannedTokens.push(new Token(tokType, tokValue, this.line, this.column - (this.currentChar - this.start)));
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
        // Advance as long as we receive digits
        while(this.is_digit(this.peek())){ this.advance()};
        
        //Handle decimal numbers
        if(this.peek() === '.' && this.is_digit(this.peek_next())){
            this.advance();
            while(this.is_digit(this.peek())){this.advance()};
        }

        let numberValue : number = parseFloat(this.srcCode.substring(this.start, this.currentChar));
        this.add_token(TokenType.NUMBER, numberValue);
    }

    private is_alpha(char : string) : boolean{
        return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || char == '_';
    }

    private is_alphaNumeric(char : string){
        return this.is_alpha(char) || this.is_digit(char);
    }

    private scan_identifier() : void{
        while(this.is_alphaNumeric(this.peek())){ this.advance() };

        const reserved = keywords[this.srcCode.substring(this.start, this.currentChar)];

        if(typeof reserved == "number"){
            this.scannedTokens.push(new Token(reserved, TokenType[reserved], this.line, this.column));
            //this.scannedTokens.push(new Token(reserved, null));
            return;
        }
        this.scannedTokens.push(new Token(TokenType.IDENTIFIER, this.srcCode.substring(this.start, this.currentChar), this.line, this.column));
    }

    private get_line_content(lineNumber: number): string {
        let startIdx = this.srcCode.lastIndexOf('\n', this.currentChar - 1) + 1;
        let endIdx = this.srcCode.indexOf('\n', this.currentChar);
        if (endIdx === -1) endIdx = this.srcCode.length;
        return this.srcCode.substring(startIdx, endIdx);
    }

    private scan_token() : void{
        let c = this.advance();
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

            // Single char tokens
            case '(': this.add_token(TokenType.LEFT_PAREN, this.srcCode.substring(this.start, this.currentChar)); break;
            case ')': this.add_token(TokenType.RIGHT_PAREN, this.srcCode.substring(this.start, this.currentChar)); break;
            case '{': this.add_token(TokenType.LEFT_BRACE, this.srcCode.substring(this.start, this.currentChar)); break;
            case '}': this.add_token(TokenType.RIGHT_BRACE, this.srcCode.substring(this.start, this.currentChar)); break;
            case ',': this.add_token(TokenType.COMMA, this.srcCode.substring(this.start, this.currentChar)); break;
            case '=': this.add_token(TokenType.EQUAL, this.srcCode.substring(this.start, this.currentChar)); break;
            case ';': this.add_token(TokenType.SEMICOLON, this.srcCode.substring(this.start, this.currentChar)); break;
            case '-': this.add_token(TokenType.BINARY_OP, this.srcCode.substring(this.start, this.currentChar)); break;
            case '+': this.add_token(TokenType.BINARY_OP, this.srcCode.substring(this.start, this.currentChar)); break;
            case '/': this.add_token(TokenType.BINARY_OP, this.srcCode.substring(this.start, this.currentChar)); break;
            case '*': this.add_token(TokenType.BINARY_OP, this.srcCode.substring(this.start, this.currentChar)); break;
            case '%': this.add_token(TokenType.BINARY_OP, this.srcCode.substring(this.start, this.currentChar)); break;
            

            default:
                // Multichar tokens
                if(this.is_digit(c)){
                    this.scan_number();
                }else if(this.is_alpha(c)){
                    this.scan_identifier();
                }else{
                    let lineContent = this.get_line_content(this.line);
                    const error = new IllegalCharErr(this.origin, this.line, this.column - 1, c, lineContent);
                    error.printlnError();
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
        
        this.scannedTokens.push(new Token(TokenType.END_OF_FILE, null, this.line, this.column));
        return this.scannedTokens;
    }

};

// Test scanner
//const lexer = new Scanner(`let x = 45.2 * (4 / 3)`, "programa.april");
// const lexer = new Scanner("10 - x + y");
//console.log(lexer.scan_tokens());