import { AssignmentExpr, BinaryExpr, Identifier, ObjectLiteral, CallExpr } from "../../frontal/ast.ts";
import Environment from "../env.ts";
import { evaluate } from "../interpreter.ts";
import { NumberValue, RuntimeValue, NilValue, ObjectValue, DEFNIL, StdFunc, FunctionVal } from "../values.ts";

export function eval_num_binexp(leftSide : NumberValue, rightSide : NumberValue, operator : string) : NumberValue {
    let result : number = 0; //Check later
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
            // TODO: handle division by zero
            result = leftSide.value / rightSide.value;
            break;
        case "%":
            result = leftSide.value % rightSide.value;
            break;
    }

    return { value: result, type: "number" } as NumberValue;
}

export function eval_binexp(binop : BinaryExpr, env : Environment) : RuntimeValue {
    const leftSide : RuntimeValue = evaluate(binop.left, env);
    const rightSide : RuntimeValue = evaluate(binop.right, env);

    if(leftSide.type == "number" && rightSide.type == "number"){
        return eval_num_binexp(leftSide as NumberValue, rightSide as NumberValue, binop.operator);
    }

    // One or both are null
    return { type: "nil", value: null} as NilValue;
}

export function eval_identifier(ident: Identifier, env : Environment) : RuntimeValue{
    const val = env.lookup_var(ident.symbol);
    return val;
}

export function eval_assignment(node: AssignmentExpr, env : Environment) : RuntimeValue{
    if (node.assigne.kind !== "Identifier"){
        throw `Invalid LHS inside assignment expr ${JSON.stringify(node.assigne)}`;
    }

    const varname = (node.assigne as Identifier).symbol;
    return env.assign_var(varname, evaluate(node.value, env));
}

export function eval_object_expr(
    obj: ObjectLiteral, 
    env : Environment
  ) : RuntimeValue{
    const object = {type: "object", properties: new Map()} as ObjectValue;

    for(const {key, value} of obj.properties){
        const runtimeVal = (value == undefined) 
          ? env.lookup_var(key) : evaluate(value, env); 
        
        object.properties.set(key, runtimeVal);
    }
    
    return object;

}

export function eval_call_expr(
    expr: CallExpr, 
    env : Environment,
  ) : RuntimeValue{
    const args = expr.args.map((arg) => evaluate(arg, env));
    const fn = evaluate(expr.caller, env);

    if(fn.type == "std-function"){
        const result = (fn as StdFunc).call(args, env);
        return result;
    }

    if(fn.type == "function"){
        const func = fn as FunctionVal;
        const scope = new Environment(func.declarationEnv);

        // Create vars for parameters list
        for(let i = 0; i < func.parameters.length; i++){
            const varname = func.parameters[i];
            scope.declare_var(varname, args[i], false);
        }

        let result : RuntimeValue = DEFNIL();

        for(const stmt of func.body){
            result = evaluate(stmt, scope);
        }

        return result;
    }

    throw "Cannot call values that is not a function: " + JSON.stringify(fn);
}