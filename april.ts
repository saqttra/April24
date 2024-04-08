import { evaluate } from "./runtime/interpreter.ts";
import { DEFNIL, DEFBOOL } from "./runtime/values.ts";
import Parser from "./frontal/parser.ts";
import { setupGlobalEnv } from "./runtime/env.ts";

declare var Deno: any; // for Deno run environment as our VM.

function repl() : void {
    const parser = new Parser();
    const env = setupGlobalEnv();

    console.log("April-24 v.1.0.0");
    for(;;){
        const lineInput = prompt("user=> ")!;

        if (!lineInput || lineInput.includes("exit")){
            Deno.exit(1);
        };

        // Grow AST from src code
        const aprilProgram = parser.grow_ast(lineInput);
        // console.log(aprilProgram); // Show AST in console

        const result = evaluate(aprilProgram, env);
        console.log(result);
    }
}

async function run(filename : string) {
    const parser = new Parser();
    const env = setupGlobalEnv();
    
    const srcCode = await Deno.readTextFile(filename);
    const program = parser.grow_ast(srcCode);
    const result = evaluate(program, env);
    //console.log(result);
}


// deno run -A april.ts

//repl();

run("./main.april");