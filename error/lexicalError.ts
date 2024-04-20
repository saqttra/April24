import BaseError from "./baseError.ts";

export class IllegalCharErr extends BaseError {
    private static readonly ERRCODE: number = 100;
    private static readonly ERRTYPE: string = "LexicalError";
    private static readonly ERRDSCRPTN: string = "Illegal character";
    private illegalChar: string;

    constructor(errorSrc: string, 
                line: number, 
                column: number,
                illegalChar: string,
                lineContent: string) { 
        super(IllegalCharErr.ERRCODE, IllegalCharErr.ERRTYPE, IllegalCharErr.ERRDSCRPTN, errorSrc, line, column);
        this.illegalChar = illegalChar;

        const padding = ' '.repeat(line.toString().length);
        this.message += `${padding} |\n` +
                        `${line} | ${lineContent}\n` +
                        `${padding} | ${' '.repeat(column - 1)}^\n` +
                        `${padding} | Found illegal char: '${illegalChar}'\n` + 
                        `${padding} | Token not generated due to unsupported char.\n` + 
                        `${padding} |`;
    }
};


export class InvalidBlckCmntStartErrA extends BaseError{
    private static readonly ERRCODE: number = 101;
    private static readonly ERRTYPE: string = "LexicalError";
    private static readonly ERRDSCRPTN: string = "Block comment incorrectly written";

    constructor(errorSrc: string, 
                line: number, 
                column: number,
                lineContent: string) { 
        super(InvalidBlckCmntStartErrA.ERRCODE, InvalidBlckCmntStartErrA.ERRTYPE, InvalidBlckCmntStartErrA.ERRDSCRPTN, 
              errorSrc, line, column);

        const padding = ' '.repeat(line.toString().length);
        this.message += `${padding} |\n` +
                        `${line} | ${lineContent}\n` +
                        `${padding} | ${' '.repeat(column - 1)}^\n` +
                        `${padding} | Expected '|' after '#' for opening comment delimiter,\n` +
                        `${padding} | but reached EOF instead.\n` +
                        `${padding} | Block comments begin with '#|', and finish with '|#'.\n` + 
                        `${padding} |`;
    }
};

export class InvalidBlckCmntStartErrB extends BaseError{
    private static readonly ERRCODE: number = 101;
    private static readonly ERRTYPE: string = "LexicalError";
    private static readonly ERRDSCRPTN: string = "Block comment incorrectly written";

    constructor(errorSrc: string, 
                line: number, 
                column: number,
                lineContent: string) { 
        super(InvalidBlckCmntStartErrB.ERRCODE, InvalidBlckCmntStartErrB.ERRTYPE, InvalidBlckCmntStartErrB.ERRDSCRPTN, 
              errorSrc, line, column);

        const padding = ' '.repeat(line.toString().length);
        this.message += `${padding} |\n` +
                        `${line} | ${lineContent}\n` +
                        `${padding} | ${' '.repeat(column - 1)}^\n` +
                        `${padding} | Expected '|' after '#' for opening comment delimiter.\n` +
                        `${padding} | Block comments begin with '#|', and finish with '|#'.\n` + 
                        `${padding} |`;
    }
};
