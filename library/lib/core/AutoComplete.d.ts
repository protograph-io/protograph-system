import CodeMirror from "codemirror";
import { Grammar } from "../grammar/grammar.types";
import { StylePropertiesHandler } from "./StyleProperties";
export interface AutoCompleterSpec {
    firstWord: string;
    displayText: string;
    description?: string;
}
export interface DynamicAutocomplete extends Omit<AutoCompleterSpec, "firstWord"> {
    insertText: string;
    options?: Omit<DynamicAutocomplete, "options">[];
}
export declare class AutoCompleteRulesBuilder {
    private base;
    constructor(base: string);
    generate(): (cm: CodeMirror.Editor) => {
        from: {
            line: number;
            ch: number;
        };
        to: CodeMirror.Position;
        list: {
            text: string;
            displayText: string;
            description: string | null;
            render: (elt: any, data: any, cur: any) => void;
            criteria: string;
            className: string;
        }[];
    };
    private stores;
    defineLineStart(spec: AutoCompleterSpec): void;
}
export declare class AutoCompleteBuilder {
    private builder;
    constructor(includeWindowExtensions?: null | string[]);
    generate(): (cm: CodeMirror.Editor) => {
        from: {
            line: number;
            ch: number;
        };
        to: CodeMirror.Position;
        list: {
            text: string;
            displayText: string;
            description: string | null;
            render: (elt: any, data: any, cur: any) => void;
            criteria: string;
            className: string;
        }[];
    };
    private transformAndFilter;
    private getPropertyAutocomplete;
    showPropertiesHint(cm: CodeMirror.Editor, propertiesAutoComplete: DynamicAutocomplete[], lineType: Grammar.Line["type"], styleHandler?: StylePropertiesHandler): void;
}
export {};
