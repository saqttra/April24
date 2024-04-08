import Environment from "./env.ts";
import { Statement } from "../frontal/ast.ts"

// This module will define the types used at runtime
export type ValueType = 
| "nil" 
| "number" 
| "bool"  
| "object" 
| "std-function"
| "function";

export interface RuntimeValue {
    type: ValueType;
}

export interface NilValue extends RuntimeValue {
    type: "nil";
    value: null;
}

export interface NumberValue extends RuntimeValue {
    type: "number";
    value: number;
}

export interface BoolValue extends RuntimeValue {
    type: "bool";
    value: boolean;
}

export interface ObjectValue extends RuntimeValue {
    type: "object";
    properties: Map<string, RuntimeValue>;
}

export function DEFNIL(){
    return { type: "nil", value: null } as NilValue;
}

export function DEFNUM(num: number = 0){
    return { type: "number", value: num } as NumberValue;
}

export function DEFBOOL(bool: boolean = true){
    return { type: "bool", value: bool } as BoolValue;
}

export type FunctionCall = ( args: RuntimeValue[], env: Environment) => RuntimeValue;

export interface StdFunc extends RuntimeValue {
    type: "std-function";
    call: FunctionCall;
}

export function DEF_FUNC(call: FunctionCall){
    return { type: "std-function", call} as StdFunc;
}

export interface FunctionVal extends RuntimeValue{
    type: "function";
    name: string;
    parameters: string[];
    declarationEnv: Environment;
    body: Statement[];
}