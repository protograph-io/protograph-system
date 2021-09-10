import cytoscape from "cytoscape";
import { ProtoGraphLoaderNamespace } from "../../config";
import { Core } from "../../core/Core";
import { ExtensionDeclaration } from "../../core/ExtensionLoader";
import { GrammarBuilder } from "../../core/Parser";
import { EvaluatedParameter, QueryHandler } from "../../core/types";
import { Grammar } from "../../grammar/grammar.types";
import { LayoutAlign } from "../layout_align";
import fattreeExample from "./fattree";
// import fattreeImage from "./fattree-2.png";


/////////////////////////// Necessary For Any Extension ///////////////////////////

// The loader creates a store of all loaded/imported extensions.
// ... This does not install/define the extension for use in a core.
// The core.defineXXXXX is used to install the extension for a core instantiation.

// Layout extension declaration
function init(core: InstanceType<typeof Core>) {
    core.defineHandler('query', "constructor_fattree", constructor_fattree);
}
function defineGrammar(grammarBuilder: InstanceType<typeof GrammarBuilder>) {
    const expression = `("create fattree"i / "fattree"i) {return {type: "query", keyword:"constructor_fattree", parameters: []}}`;
    grammarBuilder.defineGrammarQuery("nodes_and_edges", "constructor_query_fattree", "Query: Create Fattree", expression);
}

// Layout extension Registration
// 1. Access Loader - 2. Create declaration Object - 3. Register Extension
let loader = (window as { [key: string]: any })[ProtoGraphLoaderNamespace];
let declaration: ExtensionDeclaration = {
    name: "constructor_query_fattree",
    exec: init,
    grammar: defineGrammar,
    docs: {
        name: "Fattree",
        description: "Generates a 4 core / 16 host fattree topology.",
        category: "query_constructor",
        keywords: ["networking"],
        // image: fattreeImage,
        usage: [{
            name: "Basic",
            codeExample: "fattree"
        }, {
            name: "Extended (Same As Template)",
            description: "Provides insight into how the fattree constructor can be paried with the select query or the path query to style the topology.",
            codeExample: fattreeExample
        }]
    }
};
loader.register(declaration);


////////////////////////////////////////////////////////////////////////////////




//////////////////////////// Specific Extension Logic ////////////////////////////

const input = `
// Creates 4 pods with 4 items
foreach pod in (1,2,3,4): for level in (agg, edge) : for side in (left,right) : add 1 nodes
    level: level
    pod: pod
    label: pod-level-side
    side: side

// Aign edge in pod and agg in pod
//for each pod in (1,2,3,4): for level in (agg, edge) : align (nodes where pod = pod and level = level) horizontally


//for pod in (1,2,3,4): for level in (left, right) : align (nodes where pod = pod and side = side) vertically

// Connect pods with itself
for pod in (1,2,3,4) : connect (nodes where pod = pod) with (nodes where pod = pod)

for index,offset in (left,left,right,right) : add 1 nodes
    offset: index
    side: offset
    level: core
    label: core-index-offset

for side in (left, right): connect (nodes where side = side and level = agg) with (nodes where level = core and side = side)



//separate (nodes where level = agg) (nodes where level = edge) vertically 50


for each index, edge in (nodes where level = edge) : for side in (left, right) : add 1 nodes
    edge : index
    label : host-index
    level: host
    side: side


for each index, edge in (nodes where level = edge) : connect edge with (nodes where edge = index)
`;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function createCores(core: Core, parser: PEG.Parser, pod_number: number): EvaluatedParameter {
    const input = `
    add 2 nodes
        level: edge
        pod: ${pod_number}
    add 2 nodes
        level: agg
        pod: ${pod_number}
    `;
    return core.evaluate(parser.parse(input)[0].data[0]);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function createPod(core: Core, parser: PEG.Parser, pod_number: number): EvaluatedParameter {
    const input = `
    add 2 nodes
        level: edge
        pod: ${pod_number}
    add 2 nodes
        level: agg
        pod: ${pod_number}
    `;
    return core.evaluate(parser.parse(input)[0].data[0]);
}

function alignHorizontally(layout: InstanceType<typeof LayoutAlign>, nodes: cytoscape.Collection, gap = 50, equality: boolean | string = false) {
    layout.addConstraint(nodes, "horizontal")
    for (let i = 0; i < nodes.length - 1; i++) {
        // layout.addGapInequality({ "axis": "y", "left": i, "right": i + 1, "gap": 0, "equality": "true" });
        // layout.addGapInequality({ "axis": "x", "left": i, "right": i + 1, "gap": gap, "equality": String(equality) });
        // layout.addGapInequality(nodes[i] as unknown as cytoscape.Collection, nodes[i + 1] as unknown as cytoscape.Collection, "y", 0, "true");

        // Works without this following line but spreads toward bottom instead of maintaining square pods
        layout.addGapInequality(nodes[i] as unknown as cytoscape.Collection, nodes[i + 1] as unknown as cytoscape.Collection, "x", gap, String(equality), false);
    }
}
function alignEachVerticallyEach(layout: InstanceType<typeof LayoutAlign>, nodes1: cytoscape.Collection, nodes2: cytoscape.Collection, gap = 100) {
    for (let a = 0; a < nodes1.length; a += 2) {
        for (let b = 0; b < nodes2.length; b += 2) {
            // constraints.push({ "axis": "y", "left": a, "right": b, "gap": gap, "equality": "true" });
            layout.addGapInequality(nodes1[a] as unknown as cytoscape.Collection, nodes2[b] as unknown as cytoscape.Collection, "y", gap, "true", false);
        }
    }
}
// Extension logic
const constructor_fattree: QueryHandler = ({ core, parser, parameters, namedParameters, properties, line }) => {
    if (!core.cy) throw Error("Cytoscape not initialized");
    const res = parser.parse(input)[0].data.map((line: Grammar.Line) => core.evaluate(line));

    const layout: InstanceType<typeof LayoutAlign> | undefined = core.getObject("layout_align") as LayoutAlign;
    const rows: cytoscape.Collection[] = [core.cy.filter(`node[level="core"]`), core.cy.filter(`node[level="agg"]`), core.cy.filter(`node[level="edge"]`), core.cy.filter(`node[level="host"]`)];
    let maxNodesInOneRow = Math.max(...rows.map(row => row.size()));
    let maxWidth = maxNodesInOneRow * 50;
    for (let i = 0; i < rows.length; i++) {
        let row = rows[i];
        // const gap = 50;
        // Spread wider on rows with fewer elements
        const gap = maxWidth / row.length;
        alignHorizontally(layout, row, gap);

        if (i > 0 && i < rows.length) {
            alignEachVerticallyEach(layout, rows[i - 1], row, 100);   // cores and aggs
        }
    }
    // layout.onChange();

    const collection = res.reduce((agg: cytoscape.Collection, item: EvaluatedParameter) => {
        if (typeof item === "object" && "collection" in item && item.collection) {
            return agg.union(item.collection.size() ? item.collection : item.data)
        }
        return agg;
    }, core.cy.collection());
    // console.log("FATTREE RES", collection, res)
    return {
        type: "query_result",
        keyword: line.keyword,
        query_object: ["nodes"],
        data: collection,
        collection: collection
    }
}

///////////////////////////////////////////////////////////////////////////////


// Extras
export default declaration;