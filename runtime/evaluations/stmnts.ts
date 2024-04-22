import { FuncDeclaration, Program, VarDeclaration, ForStatement, WhileStatement, IfStatement} from "../../frontal/ast.ts";
import Environment from "../env.ts";
import { evaluate } from "../interpreter.ts";
import { RuntimeValue, NilValue, DEFNIL, FunctionVal, BoolValue } from "../values.ts";

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

export function evaluateForStatement(forStmt: ForStatement, env: Environment): RuntimeValue {
    const iterations = forStmt.iterations.value; // Asume que iterations es un `NumericLiteral`
    let lastEval: RuntimeValue | null = null;

    for (let i = 0; i < iterations; i++) {
        for (const stmt of forStmt.body) {
            lastEval = evaluate(stmt, env); // Evalúa cada sentencia en el entorno actual
        }
    }

    return lastEval!; // Retorna el último valor evaluado, ajusta según la lógica de tu lenguaje
}

export function evaluateWhileStatement(whileStmt: WhileStatement, env: Environment): RuntimeValue {
    let lastEval: RuntimeValue = { type: "nil", value: null } as NilValue;

    while (true) {
        const conditionResult = evaluate(whileStmt.condition, env);

        // Comprobar que el resultado de la evaluación es un booleano antes de proceder
        if (conditionResult.type === "bool" && (conditionResult as BoolValue).value) {
            for (const stmt of whileStmt.body) {
                lastEval = evaluate(stmt, env);  // Evaluar cada sentencia en el cuerpo del bucle
            }
        } else {
            break; // Si la condición no es un booleano o es false, salir del bucle
        }
    }

    return lastEval;  // Retorna el último valor evaluado en el bucle
}

export function evaluateIfStatement(ifStmt: IfStatement, env: Environment): RuntimeValue {
    const conditionResult = evaluate(ifStmt.condition, env);

    // Comprobar que el resultado de la evaluación es un booleano antes de proceder
    if (conditionResult.type === "bool" && (conditionResult as BoolValue).value) {
        // Ejecutar el bloque de consecuencias si la condición es verdadera
        let lastEval: RuntimeValue = DEFNIL();
        for (const stmt of ifStmt.consequence) {
            lastEval = evaluate(stmt, env);  // Evaluar cada sentencia en el bloque de consecuencias
        }
        return lastEval;
    } else if (ifStmt.alternative) {
        // Ejecutar el bloque alternativo si hay uno y la condición es falsa
        let lastEval: RuntimeValue = DEFNIL();
        for (const stmt of ifStmt.alternative) {
            lastEval = evaluate(stmt, env);  // Evaluar cada sentencia en el bloque alternativo
        }
        return lastEval;
    }

    return DEFNIL(); // Si no hay bloque alternativo y la condición es falsa, retorna nil
}
