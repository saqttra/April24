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

export class MissingFnIdenErr extends BaseError{
    private static readonly ERRCODE: number = 200;
    private static readonly ERRTYPE: string = "SyntaxError";
    private static readonly ERRDSCRPTN: string = "Missing function identfier";
    private expectedTok : string;
    private receivedTok : Token;
    private lnContent : string;

    constructor(errorSrc: string, line: number, column: number, receivedTok: Token, expectedTok: string, 
                lnContent : string
    ){
        super(MissingFnIdenErr.ERRCODE, 
              MissingFnIdenErr.ERRTYPE, 
              MissingFnIdenErr.ERRDSCRPTN, 
              errorSrc, line, column);
        this.expectedTok = expectedTok;
        this.receivedTok = receivedTok;

        const padding = ' '.repeat(line.toString().length);
        
        this.message += `${padding} |\n` +
                        `${line} | ${lnContent}\n` +
                        `${padding} |${' '.repeat(column - 1)}^\n` +
                        `${padding} | Expected function name [${expectedTok}] following 'fn' keyword.\n` +
                        `${padding} | Received ${TokenType[receivedTok.get_type()]} instead.\n`;
    }
}

export class InvalidFnLP extends BaseError{
    private static readonly ERRCODE: number = 201;
    private static readonly ERRTYPE: string = "SyntaxError";
    private static readonly ERRDSCRPTN: string = "Unexpected character";
    private expectedTok : string;
    private receivedTok : Token;
    private lnContent : string;

    constructor( errorSrc: string, 
        line: number, 
        column: number,
        receivedTok: Token,
        expectedTok: string,
        lnContent : string
    ){
        super(InvalidFnLP.ERRCODE, 
              InvalidFnLP.ERRTYPE, 
              InvalidFnLP.ERRDSCRPTN, 
              errorSrc, line, column);
        this.expectedTok = expectedTok;
        this.receivedTok = receivedTok;

        const padding = ' '.repeat(line.toString().length);
        
        this.message += `${padding} |\n` +
                        `${line} | ${lnContent}\n` +
                        `${padding} |${' '.repeat(column - 1)}^\n` +
                        `${padding} | Expected ${expectedTok} following function name\n` +
                        `${padding} | Received ${TokenType[receivedTok.get_type()]} instead.\n`;
    }

}


export function error300(errOrigin : string, unsuppTok : Token) : void{
    const message = `error[E300]: ParserError - Unexpected token\n` +
                    `  --->${errOrigin}:${unsuppTok.get_line()}:${unsuppTok.get_column()}\n` +
                    `Token of type '${TokenType[unsuppTok.get_type()]}' and value '${unsuppTok.get_value()}'\n` +
                    `was found while parsing src file.`;
    console.error(message);
}