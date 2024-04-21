/*
    Recursive descent parser (top-down)
*/

import * as AST from "./ast.ts";
import  Scanner  from "./scanner.ts";
import { TokenType, Token } from "./token.ts";
import BaseError from "../error/baseError.ts";
import { MissingSemicolonErr, InvalidVarDeclErr, MissingFnIdenErr, InvalidFnLP, error300 } from "../error/syntaxError.ts";

declare var Deno: any; // For Deno run environment

// The Parser is kinda similar to the Scanner, but instead of
// consuming characters, we will consume tokens.
export default class Parser{
    private scannedTokens: Token[] = [];
    private origin : string;
    private current : number = 0;
    private srcCode: string;
    private srcCodeLns : string[] = [];

    constructor(origin : string, srcCode : string){
        this.origin = origin;
        this.srcCode = srcCode;
        this.srcCodeLns = srcCode.split('\n');
    }

    private not_eof() : boolean {
        return this.scannedTokens[0].get_type() != TokenType.END_OF_FILE;
    }

    private at() : Token{
        return this.scannedTokens[0] as Token;
    }

    private advance() : Token{
        const prevToken = this.scannedTokens.shift() as Token;
        return prevToken;
    }

    private expect(type : TokenType, err : any){
        const prevToken = this.scannedTokens.shift() as Token;
        if(!prevToken || prevToken.get_type() != type){
            console.error("Parser error:\n" + err, prevToken, " - Expecting: ", type);
            Deno.exit(1);
        }
        return prevToken;
    }

    private expect2(type : TokenType, err : any, syntaxErrCode : number, earlierTok? : Token){
        const prevToken = this.scannedTokens.shift() as Token;
        if(!prevToken || prevToken.get_type() != type){
            switch (syntaxErrCode) {
                case 200:
                    new MissingFnIdenErr(this.origin, 
                                         prevToken.get_line(), 
                                         prevToken.get_column(), 
                                         prevToken, TokenType[type],
                                         this.srcCodeLns[prevToken.get_line() - 1]
                                        ).printlnError();
                    Deno.exit(200);
                case 201:
                    new InvalidFnLP(this.origin, 
                                    prevToken.get_line(), 
                                    prevToken.get_column(), 
                                    prevToken, TokenType[type],
                                    this.srcCodeLns[prevToken.get_line() - 1]
                                    ).printlnError();
                    Deno.exit(201);
                default:
                    break;
            }
        }
        return prevToken;
    }

    private neo_expect(type: TokenType, 
                       ErrorClass: new (errorSrc: string, 
                                        line: number, 
                                        column: number, 
                                        receivedTok: Token, 
                                        expectedTok: string ) => BaseError) {
        const prevToken = this.scannedTokens.shift() as Token;
        if (!prevToken || prevToken.get_type() != type) {
            const error = new ErrorClass(this.origin, prevToken.get_line(), prevToken.get_column(), prevToken, TokenType[type]);
            error.printlnError();
            Deno.exit(1);
        }
        return prevToken;
    }

    // Create an AST of type Program: here our grammaer begins
    public grow_ast(srcCode : string) : AST.Program {

        // Pour tokens from scanner into parser
        this.scannedTokens = new Scanner(srcCode, this.origin).scan_tokens();
        //console.log(this.scannedTokens);

        // <Program> ::= <Statement>*
        const program : AST.Program = {
            kind : "Program",
            body: [], // Each element in the body is going to be a statement

        };

        // Parsing process 'til not hitting the EOF token
        while(this.not_eof()){
            program.body.push(this.parse_statement());
        }

        return program;
    }

    // The further down in the call STACK, the more precedense it has.
    private parse_statement() : AST.Statement{

        // <Statement> ::= <FuncDeclaration> | <VarDeclaration> | <Expr>
        switch(this.at().get_type()){ // curr available token
            case TokenType.FN:
                return this.parse_fn_declaration();
            case TokenType.LET:
            case TokenType.CONST:
                return this.parse_var_declaration();
            case TokenType.FOR: 
                return this.parse_for_statement();
            case TokenType.WHILE:
                return this.parse_while_statement();
            default:
                return this.parse_expression();
        }
    }

/*
    <FuncDeclaration>::= 
    
    FN <Identifier> LEFT_PAREN (<Identifier> (COMMA <Identifier>)*)? RIGHT_PAREN  LEFT_BRACE 
        <Statement>* 
    RIGHT_BRACE
    
*/
    private parse_fn_declaration() : AST.Statement {
        this.advance()// consume 'fn' keyword
        const name = this.expect2(
            TokenType.IDENTIFIER, 
            "Expected function name following 'fn' keyword.", 
            200
        ).get_value(); // function identifier

        const args = this.parse_args(); //CHECKPOINT - LAST ERRCODE 200
        const params: string[]  = [];
        for(const arg of args) {
            if(arg.kind !== "Identifier"){
                throw "Inside function declaration expected paramaters to be of type string.";
            }

            params.push((arg as AST.Identifier).symbol);
        }

        this.expect(TokenType.LEFT_BRACE, "Expected function body following declaration");
        
        const body: AST.Statement[] = [];

        while(
            this.at().get_type() !== TokenType.END_OF_FILE &&
            this.at().get_type() !== TokenType.RIGHT_BRACE
        ){
            body.push(this.parse_statement());
        }

        this.expect(TokenType.RIGHT_BRACE, "Closing brace expected inside function declaration");
        
        const fn = {
            kind: "FuncDeclaration",
            parameters: params,
            name, 
            body
        } as AST.FuncDeclaration;

        return fn;
    }

// <VarDeclaration> ::= (LET | CONST) <Identifier> (EQUAL <Expr>)? SEMICOLON
    private parse_var_declaration(): AST.Statement {
        const isConst = this.advance().get_type() == TokenType.CONST;

        // Ex: let 20 = 10 --> trigger error
        const identifier = this.neo_expect(
            TokenType.IDENTIFIER, 
            InvalidVarDeclErr
        ).get_value();
        
        // let var; --> OK;  const var; --> NO!
        if(this.at().get_type() == TokenType.SEMICOLON){
            this.advance(); // expect semicolon
            if(isConst){
                throw "Must assign value to constant."
            }
            return { kind: "VarDeclaration", 
                     identifier,
                     constant: false 
            } as AST.VarDeclaration;
        }

        // (let | const ) ident = expr;
        this.expect(TokenType.EQUAL, "Expected equals token following identifier in var declaration");
        const declaration = {
            kind: "VarDeclaration",
            value: this.parse_expression(),
            identifier,
            constant: isConst,
        } as AST.VarDeclaration;
        // Ex: let mivar = 10 --> trigger error
        this.neo_expect(
            TokenType.SEMICOLON, MissingSemicolonErr
        );
        return declaration;
    }

    private parse_for_statement() : AST.ForStatement {
        this.advance(); // Consume 'for' token
    
        // Asegurar que el siguiente token sea un número
        const iterationsToken = this.neo_expect(TokenType.NUMBER, InvalidVarDeclErr);
    
        // Convertir el valor del token a un entero.
        const iterationsValue = iterationsToken.get_value();
        if (typeof iterationsValue !== "number") {
            throw new Error("For loop iteration count must be a numeric literal.");
        }
    
        // Crear el AST para el número de iteraciones
        const numIterations = { 
            kind: "NumericLiteral", 
            value: iterationsValue 
        } as AST.NumericLiteral;
    
        // Asegurar que se abre con llave '{'
        this.neo_expect(TokenType.LEFT_BRACE, MissingSemicolonErr);
    
        const statements: AST.Statement[] = [];
    
        // Mientras no se encuentre una llave de cierre '}', sigue analizando sentencias
        while(this.at().get_type() !== TokenType.RIGHT_BRACE && this.not_eof()) {
            statements.push(this.parse_statement());
        }
    
        // Asegurar que se cierre con llave '}'
        this.neo_expect(TokenType.RIGHT_BRACE, MissingSemicolonErr);
    
        return {
            kind: "ForStatement",
            iterations: numIterations,
            body: statements
        } as AST.ForStatement;
    }

    private parse_while_statement() : AST.WhileStatement{
        this.advance(); // Consumir 'while'
    
        const condition = this.parse_expression(); // Analiza la condición, que debe ser una expresión booleana
        
        this.neo_expect(TokenType.LEFT_BRACE, MissingSemicolonErr); // Esperar '{' antes del cuerpo del bucle
    
        const body: AST.Statement[] = [];
        
        // Mientras no se encuentre una llave de cierre '}', sigue analizando sentencias
        while(this.at().get_type() !== TokenType.RIGHT_BRACE && this.not_eof()) {
            body.push(this.parse_statement());
        }
        
        this.neo_expect(TokenType.RIGHT_BRACE, MissingSemicolonErr); // Asegurarse de cerrar con '}'
        
        return {
            kind: "WhileStatement",
            condition: condition,
            body: body
        } as AST.WhileStatement;
    }

// <Expr> ::= <AssignmentExpr>
// Entry point for parsing expressions
    private parse_expression() : AST.Expr { // This works because Expr inherits from Statement
        // Expr is a Statement, but not the other way around
        return this.parse_assignment_expr();

    }

// <AssignmentExpr> ::= <AdditiveExpr> (EQUAL <Expr>)?
// Parses an assignment expression, which might just be an additive expression without an assignment.
private parse_assignment_expr(): AST.Expr {
    let expr = this.parse_logical_expr();

    if (this.at().get_type() === TokenType.EQUAL) {
        this.advance(); // Consumir '='
        const value = this.parse_assignment_expr(); // Recursivamente para asignaciones encadenadas
        expr = {
            kind: "AssignmentExpr",
            assigne: expr,
            value: value,
        } as AST.AssignmentExpr;
    }

    return expr;
}

/*
    <AdditiveExpr> ::= <MultiplicativeExpr> ((PLUS | MINUS | MOD) <MultiplicativeExpr>)*
    Parses additive expressions, which consist of terms separated by plus, minus, or modulus operators.

*/    
    private parse_additive_expr() : AST.Expr {
        let left = this.parse_multiplicative_expr();

        while(this.at().get_value() == "+" || this.at().get_value() == "-" || this.at().get_value() == "%"){
            const operator = this.advance().get_value();
            const right = this.parse_multiplicative_expr();
            left = {
                kind : "BinaryExpr",
                left,
                right,
                operator, 
            } as AST.BinaryExpr;
        }

        return left;
    }

    private parse_logical_expr(): AST.Expr {
        let expr = this.parse_equality_expr();
    
        while (this.at().get_type() === TokenType.AND || this.at().get_type() === TokenType.OR) {
            const operatorToken = this.advance(); // Consumir operador lógico
            const rightExpr = this.parse_equality_expr();
            expr = {
                kind: "BinaryExpr",
                left: expr,
                right: rightExpr,
                operator: operatorToken.get_value(),
            } as AST.BinaryExpr;
        }
    
        return expr;
    }
    
    private parse_equality_expr(): AST.Expr {
        let expr = this.parse_relational_expr();
    
        while (this.at().get_type() === TokenType.EQUAL_EQUAL || this.at().get_type() === TokenType.NOT_EQUAL) {
            const operatorToken = this.advance(); // Consumir operador de igualdad
            const rightExpr = this.parse_relational_expr();
            expr = {
                kind: "BinaryExpr",
                left: expr,
                right: rightExpr,
                operator: operatorToken.get_value(),
            } as AST.BinaryExpr;
        }
    
        return expr;
    }
    
    private parse_relational_expr(): AST.Expr {
        let expr = this.parse_additive_expr(); // Comienza con expresiones aditivas
    
        while ([TokenType.LESS, TokenType.GREATER, TokenType.LESS_EQUAL, TokenType.GREATER_EQUAL].includes(this.at().get_type())) {
            const operatorToken = this.advance(); // Consumir operador relacional
            const rightExpr = this.parse_additive_expr();
            expr = {
                kind: "BinaryExpr",
                left: expr,
                right: rightExpr,
                operator: operatorToken.get_value(),
            } as AST.BinaryExpr;
        }
    
        return expr;
    }
    
    

/*
    <MultiplicativeExpr> ::= <CallMemberExpr> ((MULTIPLY | DIVIDE) <CallMemberExpr>)*
    Parses multiplicative expressions, which consist of factors separated by 
    multiplication or division operators.
*/
    private parse_multiplicative_expr() : AST.Expr {
        let left = this.parse_call_member_expr();

        while(this.at().get_value() == "*" || this.at().get_value() == "/"){
            const operator = this.advance().get_value();
            const right = this.parse_call_member_expr();
            left = {
                kind : "BinaryExpr",
                left,
                right,
                operator, 
            } as AST.BinaryExpr;
        }

        return left;
    }

// <CallMemberExpr> ::= <MemberExpr> | <CallExpr>
// Determines whether to parse a member expression or a function call expression.
    private parse_call_member_expr() : AST.Expr {
        const member = this.parse_member_expr();

        if(this.at().get_type() == TokenType.LEFT_PAREN){
            return this.parse_call_expr(member);
        }

        return member;
    }

// <CallExpr> ::= <Expr> LEFT_PAREN <Args>? RIGHT_PAREN
// Parses a function call, including the caller and any arguments.
    private parse_call_expr(caller : AST.Expr) : AST.Expr {
        let call_expr: AST.Expr = {
            kind: "CallExpr",
            caller,
            args: this.parse_args(),
        } as AST.CallExpr;

        if (this.at().get_type() == TokenType.LEFT_PAREN){
            call_expr = this.parse_call_expr(call_expr);
        }

        return call_expr;
    }


// <Args> ::= LEFT_PAREN <ArgsList> RIGHT_PAREN
// Parses the arguments for a function call, handling the surrounding parentheses.
    private parse_args() : AST.Expr[]{
        this.expect2(TokenType.LEFT_PAREN, "Expected '('", 201);
        const args = this.at().get_type() == TokenType.RIGHT_PAREN 
            ? [] : this.parse_args_list();
        
        this.expect(
            TokenType.RIGHT_PAREN,
            "Missing ')' inside args list",
        );
        return args;
    }

/*

<ArgsList> ::= <Expr> (COMMA <Expr>)*?
Parses a list of expressions separated by commas as function arguments.
    - expr, 
    - expr, expr, expr
*/    
    private parse_args_list(): AST.Expr[] {
        const args = [this.parse_assignment_expr()];

        while(this.at().get_type() == TokenType.COMMA && this.advance()){
            args.push(this.parse_assignment_expr());
        }

        return args;
    }

/*
    <MemberExpr> ::= <PrimaryExpr>

    Currently, a member expression is just redirected to parse a primary expression.
    Might change if property access or method calls are added.

*/
    private parse_member_expr(): AST.Expr {
        return this.parse_primary_expr();
    }

    private parse_unary_expr(): AST.Expr {
        if (this.at().get_type() === TokenType.NOT) {
            const operatorToken = this.advance(); // Consumir '!'
            const operand = this.parse_unary_expr(); // Aplicar recursivamente para soportar múltiples negaciones, como !!true
            return {
                kind: "UnaryExpr",
                operator: operatorToken.get_value(),
                operand: operand,
            } as AST.UnaryExpr;
        }
        return this.parse_primary_expr(); // Si no hay operador unario, pasa al nivel de precedencia más alto
    }
    
/*

<PrimaryExpr> ::= <Identifier> | <NumericLiteral> | LEFT_PAREN <Expr> RIGHT_PAREN

PrimaryExprs are the simplest forms of expressions:
    - identifiers, 
    - numeric literals
    - parenthesized expressions.

They have the HIGHEST order of precedence

*/
    private parse_primary_expr(): AST.Expr {
        const token = this.at();

        switch (token.get_type()) {
            case TokenType.IDENTIFIER:
                const identifierValue = token.get_value();
                // Asumimos que 'true' y 'false' son los únicos identificadores que se tratan como booleanos
                if (identifierValue === "true" || identifierValue === "false") {
                    this.advance(); // Consume the identifier
                    // Directamente crea un Identifier AST node, que será resuelto en el entorno
                    return { kind: "Identifier", symbol: identifierValue } as AST.Identifier;
                }
                // Para otros identificadores, simplemente procede como antes
                return { kind: "Identifier", symbol: this.advance().get_value() } as AST.Identifier;

            case TokenType.NUMBER:
                return { kind: "NumericLiteral", value: this.advance().get_value() } as AST.NumericLiteral;
            
            case TokenType.NOT:
                return this.parse_unary_expr();
            
            case TokenType.LEFT_PAREN:
                this.advance(); // Consume '('
                const expr = this.parse_expression();
                this.expect(TokenType.RIGHT_PAREN, "Expected ')' after expression");
                return expr;

            default:
                throw new Error(`Unexpected token: ${token.get_type()}`);
        }
    }
}

// const parser = new Parser();
// console.log(parser.grow_ast("10 - x + y"));