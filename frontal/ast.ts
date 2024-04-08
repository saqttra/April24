
export type NodeType =
// Statements
| "Program" 
| "VarDeclaration"
| "FuncDeclaration"

// Expressions
| "AssignmentExpr"
| "MemberExpr"
| "CallExpr"

// Literals
| "ObjectLiteral"
| "Property"
| "NumericLiteral"
//| "NilLiteral"
| "Identifier" 
| "BinaryExpr";


/*
    Base for all statements and expressions (contructs) of the language.
    Serves as the "abstract type" (polymorphic).

    Statements don't return a value (in this lang)

    Example:
        For-loop, an statement
        for (let i = 0; i < 10; i++) {
            console.log(i);
        } --> No value, it just completes an instruction

*/
export interface Statement{ 
    kind : NodeType;
}

/*
    A program is a list of every single statement
    in the src file. One object for each construct
    in the language.
*/
export interface Program extends Statement{
    kind : "Program";
    body : Statement[]

}

export interface VarDeclaration extends Statement{
    kind: "VarDeclaration";
    constant: boolean;
    identifier: string;
    value?: Expr;
}

export interface FuncDeclaration extends Statement{
    kind: "FuncDeclaration";
    parameters: string[];
    name: string;
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

/*
    x = {foo: 42, bar: 23};
    x.foo = 43; // The left side is no longer an identifier, but an expression.
    x.bar.foo = 3;
    x[22] = 1;
*/
export interface AssignmentExpr extends Expr{
    kind: "AssignmentExpr";
    assigne: Expr;
    value: Expr;
}

// Ex: 10 - 5 -> value = 5; var1 + var2 = x; -> value = x
export interface BinaryExpr extends Expr {
    kind: "BinaryExpr";
    left: Expr;
    right: Expr;
    operator: string; // needs to be of type BinaryOperator
}

export interface CallExpr extends Expr {
    kind: "CallExpr";
    args: Expr[];
    caller: Expr;
}

export interface MemberExpr extends Expr {
    kind: "MemberExpr";
    object: Expr;
    property: Expr;
    computed: boolean;
}

export interface Identifier extends Expr{
    kind : "Identifier";
    symbol: string;
}

export interface NumericLiteral extends Expr{
    kind : "NumericLiteral";
    value: number;
}

export interface Property extends Expr{
    kind : "Property";
    key: string;
    value?: Expr;
}

export interface ObjectLiteral extends Expr{
    kind : "ObjectLiteral";
    properties: Property[];
}

/*
export interface NilLiteral extends Expr{
    kind: "NilLiteral";
    value: "null";
}
*/
