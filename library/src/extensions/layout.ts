import { ProtoGraphLoaderNamespace } from "../config";
import { AutoCompleteRulesBuilder, DynamicAutocomplete } from "../core/AutoComplete";
import { Core } from "../core/Core";
import { ExecutedParameterObject, ObjectHandler } from "../core/types";
import { ExtensionDeclaration } from "../core/ExtensionLoader";
import { log } from "../core/helpers";
import { GrammarBuilder } from "../core/Parser";
import { Grammar } from "../grammar/grammar.types";

/////////////////////////// Necessary For Any Extension ///////////////////////////

// The loader creates a store of all loaded/imported extensions.
// ... This does not install/define the extension for use in a core.
// The core.defineXXXXX is used to install the extension for a core instantiation.

// Layout extension declaration
function init(core: InstanceType<typeof Core>) {
    core.defineHandler('object', "layout", new Layout(core));
}
function defineGrammar(grammarBuilder: InstanceType<typeof GrammarBuilder>) {
    grammarBuilder.defineGrammarObject("layout", "Layout", `'layout'i {return {type: "object", keyword: "layout", parameters: []} }`);
}
function defineAutoComplete(autoCompleteRulesBuilder: InstanceType<typeof AutoCompleteRulesBuilder>) {
    autoCompleteRulesBuilder.defineLineStart({
        firstWord: "layout",
        displayText: `layout\n`,
        description: "Define properties for the layout algorithm."
    })
}

// Layout extension Registration
// 1. Access Loader - 2. Create declaration Object - 3. Register Extension
let loader = (window as { [key: string]: any })[ProtoGraphLoaderNamespace];
let declaration: ExtensionDeclaration = {
    name: "object_layout",
    exec: init,
    grammar: defineGrammar,
    autocomplete: defineAutoComplete
};
loader.register(declaration);


////////////////////////////////////////////////////////////////////////////////




//////////////////////////// Specific Extension Logic ////////////////////////////


// Extension logic
export class Layout implements ObjectHandler {
    private active = true;
    keyword = "layout"
    data = {
        name: 'breadthfirst',
        directed: true,
        animate: false && !!this.core.config.animate_duration,
    }
    layout: cytoscape.Layouts | null;
    reset() {
        this.active = true;
    }
    // Should document that this should be required for all extensions. Maybe make the core handle this if necessary.
    disable() {
        this.active = false;
    }
    constructor(private core: Core) {
        if (!this.core.cy) throw Error("Core Cytoscape not Initialized");
        this.layout = this.core.cy.layout(this.data);
        this.layout.run();
    }
    private updateLayout(data: any) {
        if (!this.core.cy) throw Error("Core Cytoscape not Initialized");
        try {
            this.layout = this.core.cy.layout(data);
        } catch {
            log("Unsupported Layout Property", this.data)
            this.layout = null;
            throw Error("Unsupported Layout Property");
        }
    }
    private generateAutoComplete(data: Record<string, any>): DynamicAutocomplete[] {
        // TODO: add more options
        // console.log("AUTOCOMPLETE layout");
        const booleanOptions: DynamicAutocomplete["options"] = [
            { insertText: "true", displayText: "true" },
            { insertText: "false", displayText: "false" }
        ];
        let extras: DynamicAutocomplete[] = [];
        if (data.name === "breadthfirst" || data.name === "grid" || data.name === "circle" || data.name === "concentric") {
            extras = extras.concat([
                { insertText: "spacingFactor", displayText: "spacingFactor", description: "(Default 1.75) Positive spacing factor, larger => try more space between nodes." },
                { insertText: "avoidOverlap", displayText: "avoidOverlap", description: "(Default true) Try to prevents node overlap; may overflow boundingBox if not enough space.", options: booleanOptions }
            ]);
        }
        if (data.name === "breadthfirst") {
            extras = extras.concat([
                { insertText: "directed", displayText: "directed", description: "(Default true) Whether the tree is directed downwards.", options: booleanOptions },
                { insertText: "circle", displayText: "circle", description: "(Default false) Put depths in concentric circles.", options: booleanOptions },
                { insertText: "grid", displayText: "grid", description: "(Default false) Whether to create an even grid into which the DAG is placed (not compatible with circle)", options: booleanOptions },
                // { insertText: "spacingFactor", displayText: "spacingFactor", description: "(Default 1.75) Positive spacing factor, larger => try more space between nodes." },
                // { insertText: "avoidOverlap", displayText: "avoidOverlap", description: "(Default true) Try to prevents node overlap; may overflow boundingBox if not enough space.", options: booleanOptions },
                { insertText: "nodeDimensionsIncludeLabels", displayText: "nodeDimensionsIncludeLabels", description: "(Default false) Whether to include the label when calculating node bounding boxes for the layout algorithm", options: booleanOptions },
                { insertText: "maximal", displayText: "maximal", description: "(Default false) Whether to shift nodes down their natural BFS depths in order to avoid upwards edges (DAGS only).", options: booleanOptions }
            ]);
        }
        const res = [
            {
                insertText: "name", displayText: "name: [algorithm name]", description: "Specifies the layout algorithm for rendering the graph.", options: [
                    { insertText: "random", displayText: "random", description: "Puts nodes in random positions." },
                    { insertText: "preset", displayText: "preset", description: "Puts nodes in the positions you specify manually." },
                    { insertText: "grid", displayText: "grid", description: "Puts nodes in a well-spaced grid." },
                    { insertText: "circle", displayText: "circle", description: "Puts nodes in a circle." },
                    { insertText: "concentric", displayText: "concentric", description: "Positions nodes in concentric circles, based on a metric that you specify to segregate the nodes into levels." },
                    { insertText: "breadthfirst", displayText: "breadthfirst", description: "Puts nodes in a hierarchy, based on a breadthfirst traversal of the graph. It is best suited to trees and forests in its default top-down mode, and it is best suited to DAGs in its circle mode." },
                    { insertText: "cose", displayText: "cose", description: "The cose (Compound Spring Embedder) layout uses a physics simulation to lay out graphs. It works well with noncompound graphs and it has additional logic to support compound graphs well." },
                ]
            },
            // Order matters, want name first
            ...extras,
            {
                insertText: "animate", displayText: "animate: [true / false]", options: booleanOptions
            },
            { insertText: "animationDuration", displayText: "animationDuration: [number]" },
            { insertText: "padding", displayText: "padding: [number]", description: "Extra spaces when fitting zoom." },
        ];
        // console.log("AUTOCOMPLETE layout done", res);
        return res;
    }
    propertiesAutoComplete() {
        // console.log("AUTOCOMPLETE calling dedicated method");
        return this.generateAutoComplete(this.data)
    }
    // Necessary
    execute({ line, properties }: ExecutedParameterObject<Grammar.Object>) {
        this.active = true;
        const data = { ...this.data, ...properties };
        this.updateLayout(data);
        this.data = data;
        const type: "object_result" = "object_result";
        return {
            type,
            query_object: [],
            keyword: line.keyword,
            data: line,
            extra: {},
            propertiesAutoComplete: () => this.generateAutoComplete(this.data)
        };
        // log("updating layout");
    }
    onChange() {
        // this.layout.run();
        if (this.active) {
            if (!this.core.cy) throw Error("Core Cytoscape not Initialized");
            this.updateLayout(this.data);
            this.layout?.run();
        }
        // log("running layout");
    }
}


///////////////////////////////////////////////////////////////////////////////


// Extras
export default declaration;