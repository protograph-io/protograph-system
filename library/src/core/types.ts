import cytoscape from "cytoscape";
import { Grammar } from "../grammar/grammar.types";
import { Core } from "./Core";
import { DynamicAutocomplete } from "./AutoComplete";

export type setState<status = any> = (status: status | ((status: status) => status)) => unknown;

// 
// Queries (maybe non-functional)
//
/**
 * The proper format for the result of a query.
 */
export interface QueryResult {
    type: "query_result" | "command_result" | "object_result";
    /**
     * Conventionally `line.keyword` (the keyword of the grammar, e.g "union")
     */
    keyword: string;
    /**
     * An array of object classes that this query returned (e.g. nodes, edges, ...).
     */
    query_object: string[];
    /**
     * Typically the same Cytoscape collection as `collection` but technically allowed to be anything.
     */
    data: any;
    /**
     * Allows the developer to return any extra data.
     */
    extra?: Record<string, any>;
    /**
     * While `data` allows any return value, the `collection` property allows other developers to assume that the return value is a Cytoscape collection; these developers can then filter or react to these elements.
     * 
     * @remark The properties listed below a code line are applied to the last `collection` set. (i.e. style and data attributes are applied to elements returned by this set)
     */
    // Doc notes: if collection returned, properties will be applied to what is assumed to be a cytoscape collection, if not returned, it is assumed that the developer handled the properties.
    collection?: cytoscape.Collection,
    /**
     * Allows a command or query to define style or data properties on the returned collection. These will be merged with the user typed properties (user properties under **this** line (not previous) takes precedence). Useful because the core automatically handles animations and timing. Pass styles here if you want them to be animated according to the core settings. Set them manually with cytoscape if you want them applied immediately regardless of animation settings.
     */
    extraCollectionProperties?: Record<string, any>,
    /**
     * A function that returns a list of dynamic autocomplete options for property names under the command, object, or query.
     * 
     * @remark See {@link DynamicAutocomplete} for specific format and rules.
     * 
     * @remark It is highly recommended that your function call any `propertiesAutoComplete` function on parameters (in the case of a command) and concat with their returned list if your command returns a collection with elements from the query.
     */
    propertiesAutoComplete?: () => DynamicAutocomplete[]
}
export module BaseQueries {
    export type Result = QueryResult;
}

/**
 * What a handler recieves, since parameters are eager evaluataed (i.e. evaluated before they are passed to the handler).
 */
export interface ExecutedParameterObject<line> {
    /**
     * An instance of the Core.
     * 
     * @remark It is often useful to access the Cytoscape instance which can be done with `core.cy`.
     */
    core: Core,
    parser: PEG.Parser,
    line: line,
    /**
     * The set of properties declared for this code line. (The properties are the list of `[key] : [values]` under a code line).
     * 
     * @remark Applying style and data properties to cytoscape is automatically handled by the core as long as the query returns a collection.
     * 
     * @remark A command/query/(especially) object can also define their own behavior for recieved properties. For commands and queries don't redefine the behavior of style properties, rather prefer parameters. Objects are free to do whatever they like with properties because there is no natural or expected behavior because objects don't directly operate on elements (nodes, elements, ...) like commands and queries.
     */
    properties: Grammar.Properties,
    /**
     * The parameters returned by the grammar.
     * 
     * @remark Parameters follow the command keyword on the same code line.
     */
    parameters: EvaluatedParameter[],
    /**
     * The named parameters returned by the grammar.
     * 
     * @remark The difference between parameters and named parameters is not decided by the user but rather by the return logic defined in the grammar fragment.
     */
    namedParameters: Record<string, EvaluatedParameter>,
}


/**
 * Utilities allow developers to define useful logic that any extension can access.
 */
export interface Utility {
    /**
     * Allows objects to define a function that will be called every keyframe.
     * 
     * @example The layout object uses this to recalculate/refresh the layout after updates for each keyframe.
     */
    onChange?: () => void;
    /**
     * Called whenever the renderer resets.
     */
    reset?: () => void;
}

/**
 * An object handler is a class that can have state.
 */
export interface ObjectHandler {
    execute: (args: ExecutedParameterObject<Grammar.Object>) => EvaluatedParameter | void;
    /**
     * Allows objects to define a function that will be called every keyframe.
     * 
     * @example The layout object uses this to recalculate/refresh the layout after updates for each keyframe.
     * 
     * @remark This runs regardless of if the user has used your object. Therefore it is wise in most cases to not do anything unless execute and reset this with the reset function.
     */
    onChange: () => void;
    /**
     * Provides a safe way to fetch autocomplete (before execute). If execute throws error, Core cannot interact with autcompete returned by execute.
     */
     propertiesAutoComplete: () => DynamicAutocomplete[]
    /**
     * Called whenever the renderer resets.
     */
    reset?: () => void;
}

/**
 * A command handler must be pure function. 
 * 
 * @remark If state is required, use am {@line Utility}.
 */
export type CommandHandler = (args: ExecutedParameterObject<Grammar.Command>) => EvaluatedParameter | void;

/**
 * A query handler must be pure function. 
 * 
 * @remark If state is required, use am {@line Utility}.
 */
export type QueryHandler = (args: ExecutedParameterObject<Grammar.Query>)
    => EvaluatedParameter;

/** The evaluated format of a parameter returned by the grammar. */
export type EvaluatedParameter = string | number | QueryResult;