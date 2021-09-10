import cytoscape from "cytoscape";
import { Grammar } from "../grammar/grammar.types";
import { Core } from "./Core";
import { DynamicAutocomplete } from "./AutoComplete";
export declare type setState<status = any> = (status: status | ((status: status) => status)) => unknown;
export interface QueryResult {
    type: "query_result" | "command_result" | "object_result";
    keyword: string;
    query_object: string[];
    data: any;
    extra?: Record<string, any>;
    collection?: cytoscape.Collection;
    extraCollectionProperties?: Record<string, any>;
    propertiesAutoComplete?: () => DynamicAutocomplete[];
}
export declare module BaseQueries {
    type Result = QueryResult;
}
export interface ExecutedParameterObject<line> {
    core: Core;
    parser: PEG.Parser;
    line: line;
    properties: Grammar.Properties;
    parameters: EvaluatedParameter[];
    namedParameters: Record<string, EvaluatedParameter>;
}
export interface Utility {
    onChange?: () => void;
    reset?: () => void;
}
export interface ObjectHandler {
    execute: (args: ExecutedParameterObject<Grammar.Object>) => EvaluatedParameter | void;
    onChange: () => void;
    propertiesAutoComplete: () => DynamicAutocomplete[];
    reset?: () => void;
}
export declare type CommandHandler = (args: ExecutedParameterObject<Grammar.Command>) => EvaluatedParameter | void;
export declare type QueryHandler = (args: ExecutedParameterObject<Grammar.Query>) => EvaluatedParameter;
export declare type EvaluatedParameter = string | number | QueryResult;
