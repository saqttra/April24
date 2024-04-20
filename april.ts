import { evaluate } from "./runtime/interpreter.ts";
import { DEFNIL, DEFBOOL } from "./runtime/values.ts";
import Parser from "./frontal/parser.ts";
import { setupGlobalEnv } from "./runtime/env.ts";

declare var Deno: any; // for Deno run environment as our VM.

// function repl() : void {
//     const parser = new Parser("repl");
//     const env = setupGlobalEnv();

//     console.log("April-24 v.1.0.0");
//     for(;;){
//         const lineInput = prompt("user=> ")!;

//         if (!lineInput || lineInput.includes("exit")){
//             Deno.exit(1);
//         };

//         // Grow AST from src code
//         const aprilProgram = parser.grow_ast(lineInput);
//         // console.log(aprilProgram); // Show AST in console

//         const result = evaluate(aprilProgram, env);
//         console.log(result);
//     }
// }

async function run(filename : string) {    
    const srcCode = await Deno.readTextFile(filename);
    const parser = new Parser(filename, srcCode);
    const env = setupGlobalEnv();
    const program = parser.grow_ast(srcCode);
    const result = evaluate(program, env);
    //console.log(result);
}


// deno run -A april.ts

//repl();

run("main.april");

// Note: v.1.2.1 last version to support JS object literal 