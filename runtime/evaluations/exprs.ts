import { AssignmentExpr, BinaryExpr, Identifier, CallExpr, UnaryExpr } from "../../frontal/ast.ts";
import Environment from "../env.ts";
import { evaluate } from "../interpreter.ts";
import { NumberValue, RuntimeValue, NilValue, BoolValue, DEFNIL, DEFBOOL, StdFunc, FunctionVal } from "../values.ts";

// Evaluar expresiones binarias numéricas
export function eval_num_binexp(leftSide : NumberValue, rightSide : NumberValue, operator : string) : NumberValue {
    let result : number = 0;
    switch (operator) {
        case "+":
            result = leftSide.value + rightSide.value;
            break;
        case "-":
            result = leftSide.value - rightSide.value;
            break;
        case "*":
            result = leftSide.value * rightSide.value;
            break;
        case "/":
            if (rightSide.value === 0) {
                throw new Error("Division by zero");
            }
            result = leftSide.value / rightSide.value;
            break;
        case "%":
            result = leftSide.value % rightSide.value;
            break;
    }
    return { value: result, type: "number" } as NumberValue;
}

// Evaluar expresiones binarias (incluyendo lógicas y comparaciones)
export function eval_binexp(binop: BinaryExpr, env: Environment): RuntimeValue {
    const leftSide = evaluate(binop.left, env);
    const rightSide = evaluate(binop.right, env);

    if (["<", ">", "==", "!=", "<=", ">="].includes(binop.operator)) {
        return eval_num_comparison(leftSide as NumberValue, rightSide as NumberValue, binop.operator);
    }

    if (binop.operator === "&&" || binop.operator === "||") {
        return eval_bool_binexp(leftSide, rightSide, binop.operator);
    }

    if (leftSide.type === "number" && rightSide.type === "number") {
        return eval_num_binexp(leftSide as NumberValue, rightSide as NumberValue, binop.operator);
    }

    return DEFNIL();
}

// Evaluar comparaciones numéricas que devuelven valores booleanos
export function eval_num_comparison(leftSide: NumberValue, rightSide: NumberValue, operator: string): BoolValue {
    switch (operator) {
        case "<":
            return DEFBOOL(leftSide.value < rightSide.value);
        case ">":
            return DEFBOOL(leftSide.value > rightSide.value);
        case "==":
            return DEFBOOL(leftSide.value === rightSide.value);
        case "!=":
            return DEFBOOL(leftSide.value !== rightSide.value);
        case "<=":
            return DEFBOOL(leftSide.value <= rightSide.value);
        case ">=":
            return DEFBOOL(leftSide.value >= rightSide.value);
        default:
            throw new Error("Invalid comparison operator");
    }
}

// Evaluar expresiones booleanas
export function eval_bool_binexp(leftSide: RuntimeValue, rightSide: RuntimeValue, operator: string): BoolValue {
    if (leftSide.type !== "bool" || rightSide.type !== "bool") {
        throw new Error("Logical operations require boolean operands");
    }

    switch (operator) {
        case "&&":
            return DEFBOOL((leftSide as BoolValue).value && (rightSide as BoolValue).value);
        case "||":
            return DEFBOOL((leftSide as BoolValue).value || (rightSide as BoolValue).value);
        default:
            throw new Error("Invalid logical operator");
    }
}


// Evaluar identificadores
export function eval_identifier(ident: Identifier, env: Environment): RuntimeValue {
    return env.lookup_var(ident.symbol);
}

// Evaluar asignaciones
export function eval_assignment(node: AssignmentExpr, env: Environment): RuntimeValue {
    if (node.assigne.kind !== "Identifier") {
        throw `Invalid LHS inside assignment expr ${JSON.stringify(node.assigne)}`;
    }
    const varname = (node.assigne as Identifier).symbol;
    return env.assign_var(varname, evaluate(node.value, env));
}

// Evaluar llamadas a funciones
export function eval_call_expr(expr: CallExpr, env: Environment): RuntimeValue {
    const args = expr.args.map(arg => evaluate(arg, env));
    const fn = evaluate(expr.caller, env);

    if (fn.type === "std-function") {
        return (fn as StdFunc).call(args, env);
    }

    if (fn.type === "function") {
        const func = fn as FunctionVal;
        const scope = new Environment(func.declarationEnv);

        // Crear variables para la lista de parámetros
        for (let i = 0; i < func.parameters.length; i++) {
            const varname = func.parameters[i];
            scope.declare_var(varname, args[i], false);
        }

        let result: RuntimeValue = DEFNIL();
        for (const stmt of func.body) {
            result = evaluate(stmt, scope);
        }

        return result;
    }

    throw new Error("Cannot call value that is not a function: " + JSON.stringify(fn));
}

export function eval_unary_expr(unaryExpr: UnaryExpr, env: Environment): BoolValue {
    const operand = evaluate(unaryExpr.operand, env);

    if (operand.type !== "bool") {
        throw new Error("Unary 'not' operation requires a boolean operand");
    }

    // Negación lógica
    return DEFBOOL(!(operand as BoolValue).value);
}
