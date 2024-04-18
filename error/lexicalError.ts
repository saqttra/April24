import BaseError from "./baseError.ts";

export class IllegalCharErr extends BaseError {
    private illegalChar: string;
    private static readonly ERRCODE: number = 100;
    private static readonly ERRTYPE: string = "LexicalError";
    private static readonly ERRDSCRPTN: string = "Illegal character";

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
                        `${padding} |\n`;
    }
};
