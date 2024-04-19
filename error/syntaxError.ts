import { TokenType, Token } from "../frontal/token.ts";
import BaseError from "./baseError.ts";


export class InvalidVarDeclErr extends BaseError{
    private static readonly ERRCODE: number = 251;
    private static readonly ERRTYPE: string = "SyntaxError";

    private expectedTok: string;
    private receivedTok: Token;

    constructor(errorSrc: string, 
                line: number, 
                column: number,
                receivedTok: Token,
                expectedTok: string
    ){
        super(InvalidVarDeclErr.ERRCODE,
              InvalidVarDeclErr.ERRTYPE,
              "Invalid  var/const declaration", 
              errorSrc, line, column);
        this.expectedTok = expectedTok;
        this.receivedTok = receivedTok;
        
        const padding = ' '.repeat(line.toString().length);
        this.message += `${padding} |\n` +
                        `${line} | ${receivedTok.get_value()}\n` +
                        `${padding} | ${'^'.repeat(receivedTok.get_value()!.toString().length)}\n` +
                        `${padding} | In var declaration: expected ${expectedTok} name\n` + 
                        `${padding} | followed by 'let' or 'const' keywords, but got ${TokenType[receivedTok.get_type()]} instead.\n`;

    }
}

export class MissingSemicolonErr extends BaseError {
    private static readonly ERRCODE: number = 250;
    private static readonly ERRTYPE: string = "SyntaxError";
    private static readonly ERRDSCRPTN: string = "Missing semicolon";
    private expectedTok : string;
    private receivedTok : Token;

    constructor(
        errorSrc: string, 
        line: number, 
        column: number,
        receivedTok: Token,
        expectedTok: string
    ){
        super(MissingSemicolonErr.ERRCODE, 
              MissingSemicolonErr.ERRTYPE, 
              MissingSemicolonErr.ERRDSCRPTN, 
              errorSrc, line, column);
        this.expectedTok = expectedTok;
        this.receivedTok = receivedTok;
            

        const padding = ' '.repeat(line.toString().length);
        this.message += `${padding} |\n` +
                        `${line} | ${receivedTok.get_value()}\n` +
                        `${padding} | ${'^'.repeat(column - 1)}\n` +
                        `${padding} | Missing ';' at the end of var declaration.\n` + 
                        `${padding} | Expected ${expectedTok}, but got ${TokenType[receivedTok.get_type()]} instead.\n`;
    }
};