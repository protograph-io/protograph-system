/**
 * Defines what to expect to be returned by the PEG.js grammar.
 */
export namespace Grammar {
    /**
     * A PEG.js Location object
     */
    export type Location = {
        "start": {
            "offset": number,
            "line": number,
            "column": number
        },
        "end": {
            "offset": number,
            "line": number,
            "column": number
        }
    };
    /**
     * The generalized return value of any code line.
     */
    export type Line = Command | Object | QueryLine;
    /** 
     * The acceptable format of a single parameter in `parameters` or `named_parameters`. 
     * 
     * @remark Format is enforced so that the interpreter can eager evaluate parameters before passing it to the parent.
     * 
     * @remark The interpreter tries to evaluate any object, so use {@link Plain} to return custom objects.
     * 
     * */
    export type SingleParameter = Line | Plain | string | number;
    /** An array of parameters that the developer decides. Can include the return/evaluation value of queries. */
    export type Parameters = SingleParameter[];
    /** Like {@link Parameters} but an object/dictionary. */
    export type NamedParameters = Record<string, SingleParameter>;
    export type Properties = Record<string, string>;
    /** The general shape of a PEG.js return type. 
     * Look at specific instances (Hierarchy)  */
    export interface PEGjsRuleReturnValue {
        /** Informs the interpreter which router to use */
        type: string,
        /** The handler id/name used in routing once the router is chosen. */
        keyword: string;
        /** An array of parameters that the developer decides. Can include the return/evaluation value of queries. */
        parameters: Parameters;
        /** Like parameters but an object/dictionary. */
        named_parameters?: NamedParameters;
        /**
         * @internal
         * 
         * Used to locate which line the user is actively typing for autocomplete.
         */
        "location": Location,
        raw: string;
    }
    /**
     * The proper return format of a PEG.js object fragment/rule.
     */
    export interface Object extends PEGjsRuleReturnValue {
        type: "object",
        properties: Properties;
        returnAutoComplete?: boolean;
        
    }
    /**
     * Allows developers to return an arbitrary parameter of any type without the interpreter trying to evalute it. Required if a parameter is a custom object/array.
     */
    export type Plain = Record<string, any> & {
        type: "plain",
    }
    /**
     * The proper return format of a PEG.js command fragment/rule.
     */
    export interface Command extends PEGjsRuleReturnValue {
        type: "command",
        returnAutoComplete?: boolean;
        // Maybe?
        properties: Properties;
    }
    export type QueryLine = Query & {
        properties?: Properties
    }
    /**
     * The proper return format of a PEG.js query fragment/rule.
     */
    export interface Query extends PEGjsRuleReturnValue {
        type: "query",
        returnAutoComplete?: boolean;
    };
    export type Keyframe = Line[]
    export type Animation = {data: Keyframe, location: Location, raw: string; newlines: {index: number, raw: string}[] }[]
}
