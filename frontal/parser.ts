/*
    Recursive descent parser (top-down)
*/

import * as AST from "./ast.ts";
import  Scanner  from "./scanner.ts";
import { TokenType, Token } from "./token.ts";
import BaseError from "../error/baseError.ts";
import { MissingSemicolonErr, InvalidVarDeclErr } from "../error/syntaxError.ts";

declare var Deno: any; // For Deno run environment

// The Parser is kinda similar to the Scanner, but instead of
// consuming characters, we will consume tokens.
export default class Parser{
    private scannedTokens: Token[] = [];
    private origin : string;

    constructor(origin : string){
        this.origin = origin
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

    private neo_expect(type: TokenType, 
                       ErrorClass: new (errorSrc: string, 
                                        line: number, 
                                        column: number, 
                                        receivedTok: Token, 
                                        expectedTok: string ) => BaseError) {
        const prevToken = this.scannedTokens.shift() as Token;
        if (!prevToken || prevToken.get_type() != type) {
            const error = new ErrorClass(this.origin, prevToken.get_line(), prevToken.get_end(), prevToken, TokenType[type]);
            error.printlnError();
            Deno.exit(1);
        }
        return prevToken;
    }

    // Create an AST of type Program
    public grow_ast(srcCode : string) : AST.Program {

        // Pour tokens from scanner into parser
        this.scannedTokens = new Scanner(srcCode, this.origin).scan_tokens();
        console.log(this.scannedTokens);

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
            case TokenType.LET:
            case TokenType.CONST:
                return this.parse_var_declaration();
            case TokenType.FN:
                return this.parse_fn_declaration();
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
        this.advance(); // consume 'fn' keyword
        const name = this.expect(
            TokenType.IDENTIFIER, 
            "Expected function name following 'fn' keyword."
        ).get_value();

        const args = this.parse_args();
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
    parse_var_declaration(): AST.Statement {
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


// <Expr> ::= <AssignmentExpr>
// Entry point for parsing expressions
    private parse_expression() : AST.Expr { // This works because Expr inherits from Statement
        // Expr is a Statement, but not the other way around
        return this.parse_assignment_expr();

    }

// <AssignmentExpr> ::= <AdditiveExpr> (EQUAL <Expr>)?
// Parses an assignment expression, which might just be an additive expression without an assignment.
    private parse_assignment_expr(): AST.Expr {
        //const left = this.parse_object_expr();

        const left = this.parse_additive_expr();  // Modificación sugerida
        // <MemberExpr> EQUAL <Expr>
        if(this.at().get_type() == TokenType.EQUAL){
            this.advance(); // pass the '=';
            const value = this.parse_assignment_expr();
            return {value, assigne: left, kind: "AssignmentExpr"} as AST.AssignmentExpr;
        }
        return left; 
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
        this.expect(TokenType.LEFT_PAREN, "Expected '('");
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

/*

<PrimaryExpr> ::= <Identifier> | <NumericLiteral> | LEFT_PAREN <Expr> RIGHT_PAREN

PrimaryExprs are the simplest forms of expressions:
    - identifiers, 
    - numeric literals
    - parenthesized expressions.

They have the HIGHEST order of precedence
*/
    private parse_primary_expr() : AST.Expr{
        const token = this.at().get_type();

        switch(token){
            // <Identifier> ::= IDENTIFIER
            case TokenType.IDENTIFIER:
                                             // to avoid infinite loop, the tokens must be consumed
                                             //                                     ___________|
                                             //                                    v                
                return {kind: "Identifier", symbol: this.advance().get_value()} as AST.Identifier;
            
            // case TokenType.NIL:
            //     this.advance(); // consume the null keyword
            //     return {kind: "NilLiteral", value: "nil"} as AST.NilLiteral;

            // <NumericLiteral> ::= NUMBER
            case TokenType.NUMBER:
                                            // Already converted to float since scanning; check scanner.ts;
                return {kind: "NumericLiteral", value: this.advance().get_value()} as AST.NumericLiteral;
            
            case TokenType.LEFT_PAREN:
                this.advance(); // Consume '('
                const value = this.parse_expression();
                this.expect(TokenType.RIGHT_PAREN, "Unexpected token inside parenthesized expr. Expected ')'."); // Consume ')'
                return value;

            default:
                console.error("Unexpected token found during parsing!", this.scannedTokens[0]);
                Deno.exit(1);
                return {} as AST.Statement; // To silence compiler warnings.
        }
    }
}

// const parser = new Parser();
// console.log(parser.grow_ast("10 - x + y"));