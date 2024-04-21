/*
    AST node types that represent the language's constructions
*/

export type NodeType =
| "Program" // Complete program; the seed/root

// Statements: declarations & control flow structures
| "VarDeclaration"
| "FuncDeclaration"
| "ForStatement"
| "WhileStatement"

// Expressions: they produce a value
| "AssignmentExpr"
| "CallExpr"
| "BinaryExpr" // involves operators: +, -, *, /, %
| "UnaryExpr" // involves operators: !

| "Identifier" // vars, consts, funcs
// Literals: direct values in the src code
| "NumericLiteral" // 123
//| "NilLiteral"
| "BooleanLiteral";


/*
    Base for all statements and expressions (constructions) of the language.
    Serves as the "abstract type" (polymorphic).

    Statements don't return a value (in this lang)

    Example:
        For-loop, an statement
        for (let i = 0; i < 10; i++) {
            console.log(i);
        } --> No value, it just completes an instruction

*/
export interface Statement{ 
    kind : NodeType; // Specifies the node it represents
}

/*
    A program is a list of every single statement
    in the src file. One object for each construct
    in the language.

    Program: list of statements
*/
export interface Program extends Statement{
    kind : "Program";
    body : Statement[]
}

export interface VarDeclaration extends Statement{
    kind: "VarDeclaration";
    constant: boolean;
    identifier: string;
    value?: Expr; // value assigned to the var,
                  // it's optional so it can handle: let myvar;
}

export interface FuncDeclaration extends Statement{
    kind: "FuncDeclaration";
    parameters: string[];
    name: string;
    body: Statement[]; // list of statements
}

export interface ForStatement extends Statement {
    kind: "ForStatement";
    iterations: NumericLiteral;
    body: Statement[];
}

export interface WhileStatement extends Statement {
    kind: "WhileStatement";
    condition: Expr;
    body: Statement[];
}

export interface Expr extends Statement{
    /*
    Expressions return a value, they evaluate.

    Examples:
        Assignment, an expression
        let x = 42; -> value = 42

    */
}

export interface AssignmentExpr extends Expr{
    kind: "AssignmentExpr";
    assigne: Expr;
    value: Expr;
}

export interface CallExpr extends Expr {
    kind: "CallExpr";
    args: Expr[]; // args passed to the function
    caller: Expr; // expression called
}

// Ex: 10 - 5 -> value = 5; var1 + var2 = x; -> value = x
export interface BinaryExpr extends Expr {
    kind: "BinaryExpr";
    left: Expr;
    right: Expr;
    operator: string; // needs to be of type BinaryOperator
}

export interface UnaryExpr extends Expr {
    kind: "UnaryExpr";
    operator: string; // '!'
    operand: Expr;
}

export interface Identifier extends Expr{
    kind : "Identifier";
    symbol: string;
}

export interface NumericLiteral extends Expr{
    kind : "NumericLiteral";
    value: number;
}

/*
export interface NilLiteral extends Expr{
    kind: "NilLiteral";
    value: "null";
}
*/

export interface BooleanLiteral extends Expr {
    kind: "BooleanLiteral";
    value: boolean;
}