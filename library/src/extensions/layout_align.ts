

import cytoscape from 'cytoscape';
import { ProtoGraphLoaderNamespace } from "../config";
import { AutoCompleteRulesBuilder, DynamicAutocomplete } from "../core/AutoComplete";
import { Core } from "../core/Core";
import { ExtensionDeclaration, ExtensionDocsDecleration } from "../core/ExtensionLoader";
import { log } from "../core/helpers";
import { GrammarBuilder } from "../core/Parser";
import { CommandHandler, ExecutedParameterObject, ObjectHandler, QueryResult } from "../core/types";
import { Grammar } from "../grammar/grammar.types";
import { Layout as BaseLayout } from "./layout";
let cola = require('cytoscape-cola');

cytoscape.use(cola); // register extension

const docs: ExtensionDocsDecleration = {
    name: "Align & Separate",
    description: "Align: allows for aligning nodes in a horizontal or vertical line.\n\nSeparate: allows for separating nodes by suggesting distance between nodes.\n\n Disables the current layout and uses a force-directed layout that allows for specifying of alignment constraints.",
    category: "command", 
    keywords: ["basics"],
    usage: [{
        name: "Align Vertically",
        description: "Aligns nodes in a vertical line, one on top of another.",
        codeExample: "align n1, n2 vertically",
        dependencies: ["query_node"],
    }, {
        name: "Align Horizontally",
        description: "Aligns nodes in a horizontal line, each directly next to another.",
        codeExample: "align all nodes horizontally",
        dependencies: ["query_node"],
    },{
        name: "Separate Vertically",
        description: "Causes the *right* nodes to be below the *left* nodes by a suggested distance. In this example, n2 is 20 units below n1.",
        codeExample: "separate n1 n2 vertically 20",
        dependencies: ["query_node"],
    }, {
        name: "Separate Horizontally",
        description: "Causes the *right* nodes to be to right of the *left* nodes by a suggested distance. In this example, n2 is 20 units to the right of n1.",
        codeExample: "separate n1 n2 horizontally 20",
        dependencies: ["query_node"],
    }]
};

/////////////////////////// Necessary For Any Extension ///////////////////////////

// The loader creates a store of all loaded/imported extensions.
// ... This does not install/define the extension for use in a core.
// The core.defineXXXXX is used to install the extension for a core instantiation.

// Layout extension declaration
function init(core: InstanceType<typeof Core>) {
    const layout = new LayoutAlign(core);
    const command = new AlignCommand(layout);
    core.defineHandler('object', "layout_align", layout);
    command.init(core);
}
function defineGrammar(grammarBuilder: InstanceType<typeof GrammarBuilder>) {
    AlignCommand.defineGrammar(grammarBuilder);
    grammarBuilder.defineGrammarObject("layout_align", "Layout_Align", `'layout_align'i {return {type: "object", keyword: "layout_align", parameters: []} }`);
}
function defineAutoComplete(autoCompleteRulesBuilder: InstanceType<typeof AutoCompleteRulesBuilder>) {
    AlignCommand.defineAutoComplete(autoCompleteRulesBuilder);
    autoCompleteRulesBuilder.defineLineStart({
        firstWord: "layout_align",
        displayText: `layout_align\n`,
        description: "Use a custom (webcola) layout to set alignment constraints. (Incompatible with `layout`)"
    })
}

// Layout extension Registration
// 1. Access Loader - 2. Create declaration Object - 3. Register Extension
let loader = (window as { [key: string]: any })[ProtoGraphLoaderNamespace];
let declaration: ExtensionDeclaration = {
    name: "object_layout_align",
    exec: init,
    grammar: defineGrammar,
    autocomplete: defineAutoComplete,
    docs
};
loader.register(declaration);


////////////////////////////////////////////////////////////////////////////////




//////////////////////////// Specific Extension Logic ////////////////////////////


// Extension logic
export class LayoutAlign implements ObjectHandler {
    keyword = "layout"
    data = {
        name: 'cola',
        // BUG: with cola plugin. Currently animate true/false result in different layouts which mean main render and snapshots did not match
        // Possible alternative fix is to change how frames are rendered
        // As of now, the solution is to disable cola layout animation, which is a bummer because adding constraints between steps seems cool
        // Animate conforms to Core animation setting
        // Without this, headless renders before layout complete
        animate: false && !!this.core.config.animate_duration,
        alignment: { vertical: ([] as any[]), horizontal: ([] as any[]) }, // relative alignment constraints on nodes, e.g. {vertical: [[{node: node1, offset: 0}, {node: node2, offset: 5}]], horizontal: [[{node: node3}, {node: node4}], [{node: node5}, {node: node6}]]}
        gapInequalities: [] as any[], // list of inequality constraints for the gap between the nodes, e.g. [{"axis":"y", "left":node1, "right":node2, "gap":25}]
        maxSimulationTime: 1000
    }
    layout: cytoscape.Layouts | null;
    private _active = false;
    isActive() {
        return this._active;
    }
    activate() {
        if (this._active) return;
        this._active = true;
        const baseLayout: InstanceType<typeof BaseLayout> | undefined = this.core.getObject("layout") as BaseLayout;
        baseLayout && baseLayout.disable();
    }
    reset() {
        this._active = false;
        this.data = {
            name: 'cola',
            // Animate conforms to Core animation setting
            // Without this, headless renders before layout complete
            animate: false && !!this.core.config.animate_duration,
            alignment: { vertical: ([] as any[]), horizontal: ([] as any[]) }, // relative alignment constraints on nodes, e.g. {vertical: [[{node: node1, offset: 0}, {node: node2, offset: 5}]], horizontal: [[{node: node3}, {node: node4}], [{node: node5}, {node: node6}]]}
            gapInequalities: [], // list of inequality constraints for the gap between the nodes, e.g. [{"axis":"y", "left":node1, "right":node2, "gap":25}],
            maxSimulationTime: 1000
        };
    }
    disable() {
        this._active = false;
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
        const booleanOptions: DynamicAutocomplete["options"] = [
            { insertText: "true", displayText: "true" },
            { insertText: "false", displayText: "false" }
        ];
        const res = [
            // Order matters, want name first
            { insertText: "avoidOverlap", displayText: "avoidOverlap", description: "(Default true) Try to prevents node overlap; may overflow boundingBox if not enough space.", options: booleanOptions },
            // {
            //     insertText: "animate", displayText: "animate: [true / false]", options: booleanOptions
            // },
            // { insertText: "animationDuration", displayText: "animationDuration: [number]" },
            { insertText: "padding", displayText: "padding: [number]", description: "Extra spaces when fitting zoom." },
        ];
        return res;
    }
    propertiesAutoComplete() {
        return this.generateAutoComplete(this.data)
    }
    // Necessary
    execute({ line, properties }: ExecutedParameterObject<Grammar.Object>) {
        this.activate();
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
        if (this.isActive()) {
            if (!this.core.cy) throw Error("Core Cytoscape not Initialized");
            const nodes = this.data.alignment.horizontal.concat(this.data.alignment.vertical).flat()
            // console.log("Layout change", this.data, nodes.map(n => ({ node: n, scratch: n.node.scratch(), parent: n.node.isParent() })));

            // Fixes error where compound nodes do not have scratch causing undefined error
            // This way layout is run without constraints and everything is set before constraints are added
            // Fixes error here:
            // http://localhost:3000/?comp_alg=LZUTF8&comp_enc=Base64&comp_code=ClYxLCBMTSwgQUwKICAgIHNoYXBlOiByZWN0YW5nbGXFFWhlaWdodDogNTDFD2JvcmRlci1jb2xvcjogYmxhY2sKCnIxCgpWMSAtPiBMTcQGcjHHD0FMxQ8yCsQYxGcKbjMsIG40LCBuNcVPcGFyZW50IDrEMwpuM8QubjTICTUKbjXFCTEwyQrKJzcKCm42LCBuNywgbjgsIG45z1EyxRAKbjfIQwphbGwgbm9kZXP6AO4KYWxpZ24gzlkgdmVydGljYWxsecgg6QDG0hxBTCwgcjEgaG9yaXpvbnTEGiDGfGVkZ8d8bGFiZWwgOiAiIgoKc3RlcAoK
            this.updateLayout({
                name: 'cola',
                // Animate conforms to Core animation setting
                // Without this, headless renders before layout complete
                animate: false && !!this.core.config.animate_duration,
                alignment: { vertical: [], horizontal: [] }, // relative alignment constraints on nodes, e.g. {vertical: [[{node: node1, offset: 0}, {node: node2, offset: 5}]], horizontal: [[{node: node3}, {node: node4}], [{node: node5}, {node: node6}]]}
                gapInequalities: [], // list of inequality constraints for the gap between the nodes, e.g. [{"axis":"y", "left":node1, "right":node2, "gap":25}]
            });
            this.layout?.run();
            this.updateLayout(this.data);
            this.layout?.run();
            // console.log("ALIGN UPDATE ONCHANGE", this.data)
        }
        // log("running layout");
    }
    /**
     * Allow anyone to access this object and add an align constraint
     * 
     * Caution, if used programmatically multiple times, disable update as that is very costly (computationally/time wise)
     */
    public addConstraint(col: cytoscape.Collection, axis: "vertical" | "horizontal", update = false) {
        this.activate();
        // alignment: {vertical: [], horizontal: []}, 
        // relative alignment constraints on nodes, e.g. {vertical: [[{node: node1, offset: 0}, {node: node2, offset: 5}]], horizontal: [[{node: node3}, {node: node4}], [{node: node5}, {node: node6}]]}
        // gapInequalities: [], 
        // list of inequality constraints for the gap between the nodes, e.g. [{"axis":"y", "left":node1, "right":node2, "gap":25}]
        if (!col || col.empty()) return col;
        const nodesCollection: cytoscape.NodeCollection = col.filter("node");
        if (nodesCollection.size() < 2) return col;

        let constraints = nodesCollection.map(ele => ({ node: ele }))


        this.data.alignment[axis].push(constraints);
        // On change handled by layout on change at end of frame
        // if (update) this.onChange();

        return col;
    }
    /**
     * Allow anyone to access this object and add an gap inequalities
     * 
     * Caution, if used programmatically multiple times, disable update as that is very costly (computationally/time wise)
     */
    public addGapInequality(col: cytoscape.Collection, col2: cytoscape.Collection, axis: "y" | "x", distance: number, equality: boolean | string = false, update = true) {
        this.activate();
        // alignment: {vertical: [], horizontal: []}, 
        // list of inequality constraints for the gap between the nodes, e.g. [{"axis":"y", "left":node1, "right":node2, "gap":25}]
        if (!col || col.empty()) return col;
        if (!col2 || col2.empty()) return col;
        const nodesCollection: cytoscape.NodeCollection = col.filter("node");
        if (nodesCollection.size() < 1) return col;
        const nodesCollection2: cytoscape.NodeCollection = col2.filter("node");
        if (nodesCollection2.size() < 1) return col;

        // console.log("ALIGN GAP", nodesCollection2, nodesCollection2);

        nodesCollection.forEach(left => {
            nodesCollection2.forEach(right => {
                this.data.gapInequalities.push({ axis, left, right, gap: distance, equality });
            })
        })
        // On change handled by layout on change at end of frame
        // if (update) this.onChange();
        // console.log("ALIGNED WITH GAP", this.data.gapInequalities)

        // console.log("GAP EQUALITES SIZE: ", this.data.gapInequalities.length, col.size(), col2.size(), "constaints", this.data.alignment["horizontal"].length, this.data.alignment["vertical"].length);
        return col;
    }
}


///////////////////////////////////////////////////////////////////////////////


class AlignCommand {
    constructor(public layout: LayoutAlign) {

    }

    init(core: InstanceType<typeof Core>) {
        core.defineHandler('command', "align", this.align);
    }
    static defineGrammar(grammarBuilder: InstanceType<typeof GrammarBuilder>) {
        const expression = `"align"i sp p:query_object_nodes sp axis:("horizontally"/"vertically") { return {keyword: "align", named_parameters:{type: "align", target:p, axis} } }`;
        grammarBuilder.defineGrammarCommand("align", `Align [Query] [horizontally / vertically]`, expression);
        // gapInequalities: undefined, // list of inequality constraints for the gap between the nodes, e.g. [{"axis":"y", "left":node1, "right":node2, "gap":25}]
        const gapExpression = `"separate"i sp p:query_object_nodes sp p2:query_object_nodes sp+ axis:("horizontally"/"vertically") sp+ dist:dynamic_number { return {keyword: "align", named_parameters:{type: "gap", target:p, target2:p2, axis, distance: dist} } }`;
        grammarBuilder.defineGrammarCommand("separate", `Separate [Query] [Query] [horizontally / vertically] [number (distance)]`, gapExpression);
    }
    static defineAutoComplete(autoCompleteRulesBuilder: InstanceType<typeof AutoCompleteRulesBuilder>) {
        autoCompleteRulesBuilder.defineLineStart({ firstWord: "align", displayText: `align [node query] ["horizontally"/"vertically"]`, description: "Align nodes to create a row or column." })
        autoCompleteRulesBuilder.defineLineStart({ firstWord: "separate", displayText: `separate [node query (left set)] [node query (right set)] ["horizontally"/"vertically"] [number (distance)]`, description: "Separate the left set of nodes by a positive distance horizontally (to the right) or vertically (to the bottom) from the right set of nodes." })
    }

    // Extension logic
    align: CommandHandler = (pars) => {
        this.layout.activate();
        // alignment: {vertical: [], horizontal: []}, 
        // relative alignment constraints on nodes, e.g. {vertical: [[{node: node1, offset: 0}, {node: node2, offset: 5}]], horizontal: [[{node: node3}, {node: node4}], [{node: node5}, {node: node6}]]}
        // gapInequalities: [], 
        // list of inequality constraints for the gap between the nodes, e.g. [{"axis":"y", "left":node1, "right":node2, "gap":25}]
        let namedParameters = pars.namedParameters;
        const target = ((namedParameters.target as QueryResult).data as unknown as cytoscape.Collection);
        if (!target || target.empty()) return namedParameters.target;
        const layout: InstanceType<typeof LayoutAlign> | undefined = pars.core.getObject("layout_align") as LayoutAlign;

        if (namedParameters.type === "align") {
            let axis: "vertical" | "horizontal" = "horizontal";
            if (namedParameters.axis === "vertically") axis = "vertical";

            if (layout) {
                layout.addConstraint(target, axis);
            }
        } else {
            let axis: "y" | "x" = "x";
            if (namedParameters.axis === "vertically") axis = "y";
            // console.log("ALIGN SPEC", pars.line)

            const target2 = ((namedParameters.target2 as QueryResult).data as unknown as cytoscape.Collection);
            if (!target2 || target2.empty()) return namedParameters.target;

            if (layout) {
                layout.addGapInequality(target, target2, axis, namedParameters.distance as number);
            }
        }

        return namedParameters.target;
    }
}


///////////////////////////////////////////////////////////////////////////////




// Extras
export default declaration;