import { RuntimeValue, DEFBOOL, DEFNIL, DEF_FUNC } from "./values.ts";

export function setupGlobalEnv(){ // [TS]: we will be able to mutate it since 
                                       // it is a reference, not a copy. 
                                       // In other langs, pass by pointer.
    
    const env = new Environment();
    // Setting up default global env
    env.declare_var("true", DEFBOOL(), true);
    env.declare_var("false", DEFBOOL(false), true);
    env.declare_var("nil", DEFNIL(), true);


    //Std-lib functions
    env.declare_var("println", DEF_FUNC((args, scope) => {
        console.log(...args);
        return DEFNIL();
    }), true);

    return env;
}

export default class Environment{
    private parent?: Environment;
    private variables: Map<string, RuntimeValue>;
    private constants: Set<string>;

    constructor(parentEnv?: Environment) {
        const global = parentEnv ? true : false;
        this.parent = parentEnv; // link to parent environment
        this.variables = new Map(); // variables defined in this scope
        this.constants = new Set(); // constants defined in this scope
    }

    // Declare variables that are not already defined
    public declare_var (varname: string, value : RuntimeValue, constant : boolean) : RuntimeValue{
        if(this.variables.has(varname)){
            throw `Cannot declare variable ${varname}. It is already defined.`;
        }
        this.variables.set(varname, value);

        if(constant){
            this.constants.add(varname);
        }
        return value;
    }

    // We make sure that variables exist, if so we assign
    public assign_var(varname : string, value : RuntimeValue) : RuntimeValue{
        const env = this.resolve_var(varname);

        // CANNOT overwrite constants
        if(env.constants.has(varname)){
            throw `Consts cannot be overwritten. ${varname} was declared constant`;
        }

        env.variables.set(varname, value);

        return value;
    }

    public lookup_var (varname : string) : RuntimeValue{
        const env = this.resolve_var(varname);
        return env.variables.get(varname) as RuntimeValue;
    }

    // Traverse scope of environments to find variables
    public resolve_var(varname : string) : Environment{
        if(this.variables.has(varname)){
            return this;
        }

        if(this.parent == undefined){
            throw `Could not resolve ${varname}. It does not exist`;
        }

        return this.parent.resolve_var(varname);
    }

}