import { Grammar } from "../grammar/grammar.types";
import { DynamicAutocomplete } from "./AutoComplete";
interface DynamicAutocompleteWithExtras extends DynamicAutocomplete {
    key: string;
    values: string[];
}
export declare function cytoscapeStyleAutocompleteSearch(firstIndentedWord: string, autocompleteEntries?: DynamicAutocompleteWithExtras[]): DynamicAutocompleteWithExtras[];
declare type AliasHandler = (val: any) => Record<string, any>;
declare type AliasEntry = {
    map: AliasHandler;
    autocomplete: DynamicAutocomplete;
};
export declare class StylePropertiesHandler {
    constructor(includeDefault?: boolean);
    aliases: Map<string, AliasEntry>;
    addAliases(aliasName: string, map: AliasHandler, autocomplete?: DynamicAutocomplete): void;
    parse(originalStyleProps: Record<string, any>): Record<string, any>;
    parseAndFilter(props: Grammar.Properties): Grammar.Properties;
    filterAndParse: (props: Grammar.Properties) => Grammar.Properties;
    validPreProperties(): any[];
    filterValidPreProperties(props: Grammar.Properties): Grammar.Properties;
    validPostProperties(): any[];
    filterValidPostProperties(props: Grammar.Properties): Grammar.Properties;
    replace: (originalStyleProps: Record<string, any>) => Record<string, any>;
    handle: (originalStyleProps: Record<string, any>) => Record<string, any>;
    format: (originalStyleProps: Record<string, any>) => Record<string, any>;
    autocompleteEntries: DynamicAutocompleteWithExtras[];
    updateAutocompleteEntries(): void;
    defaultAliasAutocomplete(key: string, map: AliasHandler): DynamicAutocomplete;
    autocomplete(firstIndentedWord: string): DynamicAutocomplete[];
}
export {};
