import { ProtoGraphLoaderNamespace } from "../config"
import { AutoCompleteRulesBuilder } from "./AutoComplete";
import { Core } from "./Core";
import { GrammarBuilder } from "./Parser";

/**
 * Used to generate the integrated docs window/pane.
 */
export interface ExtensionDocs {
    /**
     * Automatically set to name used in extension decleration.
     */
    id: ExtensionDeclaration["name"],
    /**
     * A human readible name for the plugin
     */
    name: string,
    /**
     * A friendly description of how to use the plugin and its features/purpose.
     * 
     * @remark Markdown Supported
     */
    description: string,
    keywords: string[],
    category: "command" | "query" | "query_constructor" | "object" | "style",
    image?: string,
    /**
     * Provides usage examples
     */
    usage?: {
        name: string;
        image?: string,
        /**
         * @remark Markdown Supported
         */
        description?: string;
        codeExample?: string;
        dependencies?: ExtensionDeclaration["name"][];
    }[],
    extraPages?: ExtensionDocsExtraPage[]
}
export interface ExtensionDocsExtraPage extends Omit<ExtensionDocs, "category" | "id"> {
    dependencies: ExtensionDeclaration["name"][];
    category: ExtensionDocs["category"] | "example";
    hash: string;
}

// Used to store extensions until core is initiated
/**
     * This interface describes the properties an extension can define and thus what an extension has access to.
     */
export interface ExtensionDeclaration {
    /**
     * A function that runs when loaded
     */
    init?: () => void;
    /** Your extension id/name. Must be unique across all extensions. */
    name: string;
    /** Used to define the extension's interpreter handler or load a utility. */
    exec: (core: InstanceType<typeof Core>) => void;
    /** Used to define the grammar rules/fragments for your extension. */
    grammar?: (grammarBuilder: InstanceType<typeof GrammarBuilder>) => void;
    /** Used to define the static line-start autocomplete list. */
    autocomplete?: (autoCompleteRulesBuilder: InstanceType<typeof AutoCompleteRulesBuilder>) => void;
    /**
     * Used to generate the integrated docs window/pane.
     */
    docs?: Omit<ExtensionDocs, "id">
}
/**
     * This interface describes the properties an extension can define and thus what an extension has access to.
     */
export type ExtensionDocsDecleration = Omit<ExtensionDocs, "id">
class ExtensionLoader {
    private extensions = new Map<ExtensionDeclaration["name"], ExtensionDeclaration>();
    private _register(extension: ExtensionDeclaration) {
        this.extensions.set(extension.name, extension);
        extension.init && extension.init();
    }
    register(extension: ExtensionDeclaration) {
        // if (this.extensions.has(name)) throw Error("Extension already loaded");
        if (this.extensions.has(extension.name)) return;
        this._register(extension);
    }
    entries() {
        return this.extensions.entries();
    }
}


const loader = (function declareGlobally() {
    return new ExtensionLoader();
})();

if (!(window as { [key: string]: any })[ProtoGraphLoaderNamespace]) {
    (window as { [key: string]: any })[ProtoGraphLoaderNamespace] = loader;
}

export default loader;