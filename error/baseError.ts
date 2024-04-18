export default class BaseError {
    private errorCode: number;
    private errorType: string;
    private errorDscrptn: string;
    private errorSrc: string;
    private line: number;
    private column: number;
    protected message: string;

    constructor(errorCode: number, 
                errorType: string, 
                errorDscrptn: string, 
                errorSrc: string, 
                line: number, 
                column: number) {
        this.errorCode = errorCode;
        this.errorType = errorType;
        this.errorDscrptn = errorDscrptn;
        this.errorSrc = errorSrc;
        this.line = line;
        this.column = column;
        this.message = `error[E${errorCode}]: ${errorType} - ${errorDscrptn}\n` +
        `  --> ${errorSrc}:${line}:${column}\n`;
    }

    printlnError() : void {
        console.error(this.message)
    }
}