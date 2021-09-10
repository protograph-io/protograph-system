import { AutoCompleteRulesBuilder } from "./AutoComplete";
import { Core } from "./Core";
import { GrammarBuilder } from "./Parser";
export interface ExtensionDocs {
    id: ExtensionDeclaration["name"];
    name: string;
    description: string;
    keywords: string[];
    category: "command" | "query" | "query_constructor" | "object" | "style";
    image?: string;
    usage?: {
        name: string;
        image?: string;
        description?: string;
        codeExample?: string;
        dependencies?: ExtensionDeclaration["name"][];
    }[];
    extraPages?: ExtensionDocsExtraPage[];
}
export interface ExtensionDocsExtraPage extends Omit<ExtensionDocs, "category" | "id"> {
    dependencies: ExtensionDeclaration["name"][];
    category: ExtensionDocs["category"] | "example";
    hash: string;
}
export interface ExtensionDeclaration {
    init?: () => void;
    name: string;
    exec: (core: InstanceType<typeof Core>) => void;
    grammar?: (grammarBuilder: InstanceType<typeof GrammarBuilder>) => void;
    autocomplete?: (autoCompleteRulesBuilder: InstanceType<typeof AutoCompleteRulesBuilder>) => void;
    docs?: Omit<ExtensionDocs, "id">;
}
export declare type ExtensionDocsDecleration = Omit<ExtensionDocs, "id">;
declare class ExtensionLoader {
    private extensions;
    private _register;
    register(extension: ExtensionDeclaration): void;
    entries(): IterableIterator<[string, ExtensionDeclaration]>;
}
declare const loader: ExtensionLoader;
export default loader;
