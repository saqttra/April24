import { ValueType, RuntimeValue, NumberValue, NilValue } from "./values.ts";
import { NodeType, Statement, AssignmentExpr, NumericLiteral, Identifier, BinaryExpr, Program, VarDeclaration, CallExpr, FuncDeclaration} from "../frontal/ast.ts";
import Environment from "./env.ts";
import { eval_program, eval_var_declaration, eval_func_declaration } from "./evaluations/stmnts.ts";
import { eval_identifier, eval_binexp, eval_assignment, eval_call_expr } from "./evaluations/exprs.ts";

declare var Deno : any; 

// First, we evaluate any node coming from the parser
export function evaluate(astNode: Statement, env : Environment): RuntimeValue{
    switch(astNode.kind){
        case "Program":
            return eval_program(astNode as Program, env);
        
        // Handle Statements
        case "VarDeclaration":
            return eval_var_declaration(astNode as VarDeclaration, env);
        
        case "FuncDeclaration":
            return eval_func_declaration(astNode as FuncDeclaration, env);

        // Handle Expressions
        case "AssignmentExpr":
            return eval_assignment(astNode as AssignmentExpr, env);

        case "NumericLiteral":
            return { 
                value: ((astNode as NumericLiteral).value),
                type: "number",
            } as NumberValue;
        
        // case "NilLiteral":
        //     return { type: "nil", value: null, } as NilValue;
        
        case "Identifier":
            return eval_identifier(astNode as Identifier, env);
        
        // case "ObjectLiteral":
        //     return eval_object_expr(astNode as ObjectLiteral, env);
        
        case "CallExpr":
                return eval_call_expr(astNode as CallExpr, env);
        
        case "BinaryExpr":
            return eval_binexp(astNode as BinaryExpr, env);

        default:
            console.error("Unsupported AST node.", astNode);
            Deno.exit(1);
            return { type: "nil", value: null, } as NilValue; // To silence compiler warnings!
    }
}
