import { FuncDeclaration, Program, VarDeclaration } from "../../frontal/ast.ts";
import Environment from "../env.ts";
import { evaluate } from "../interpreter.ts";
import { RuntimeValue, NilValue, DEFNIL, FunctionVal } from "../values.ts";

// To evaluate a program, it will run top to bottom and return the last evaluated result
export function eval_program(program: Program, env : Environment): RuntimeValue {
    let lastEvalBlock : RuntimeValue = { type: "nil", value: null} as NilValue;
    for (const statement of program.body) {
        lastEvalBlock = evaluate(statement, env);
    }
    return lastEvalBlock
}

export function eval_var_declaration(
    declaration: VarDeclaration,
    env: Environment
): RuntimeValue {
    const value = declaration.value ? evaluate(declaration.value, env) : DEFNIL();
    
    return env.declare_var(declaration.identifier, value, declaration.constant);
}

export function eval_func_declaration(
    declaration: FuncDeclaration,
    env: Environment
): RuntimeValue {

    const fn = {
        type: "function",
        name: declaration.name,
        parameters: declaration.parameters,
        declarationEnv: env,
        body: declaration.body
    } as FunctionVal;

    return env.declare_var(declaration.name, fn, true);

}