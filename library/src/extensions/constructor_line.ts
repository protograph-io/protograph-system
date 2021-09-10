import cytoscape from "cytoscape";
import { ProtoGraphLoaderNamespace } from "../config";
import { Core } from "../core/Core";
import { ExtensionDeclaration, ExtensionDocsDecleration } from "../core/ExtensionLoader";
import { GrammarBuilder } from "../core/Parser";
import { QueryHandler } from "../core/types";
import { IdGenerator } from "./id_generator";
import { edgeType, edgeMarker } from "./edge";

// TODO: Consider generalizing so that any nodes can be takes 
// ... "6 nodes" is a constructor ...

/////////////////////////// Necessary For Any Extension ///////////////////////////

// The loader creates a store of all loaded/imported extensions.
// ... This does not install/define the extension for use in a core.
// The core.defineXXXXX is used to install the extension for a core instantiation.

const forms = [
`directed line with 6 nodes`,
`line with 6 directed nodes`,
`line with 6 nodes directed`,
];
const generateMarkdownCode = (code : string) => `\`\`\`\n${code}\n\`\`\``
const docs: ExtensionDocsDecleration = {
    name: "Line",
    description: `Creates a line or path graph with (n) nodes and (n-1) nodes. Default undirected.
    ### Form 
    \`\`\`
    [create]? line with [number] nodes [directed / undirected / <- / - / ->]
    \`\`\``,
    category: "query_constructor",
    keywords: ["basics"],
    usage: [{
        name: "Basic",
        codeExample: "line with 6 nodes undirected"
    },
    {
        name: "Shorthand",
        description: "By default the statement assumes undirected edges.",
        codeExample: "line with 6 nodes"
    },
    {
        name: "Alternate Forms",
        description: "The type of edge can be specified in a number of places. An edge type can be `directed / undirected / <- / - / ->`.\n" + forms.map(f => generateMarkdownCode(f)).join("\n")
    }]
};

// Layout extension declaration
function init(core: InstanceType<typeof Core>) {
    core.defineHandler('query', "constructor_line", constructor_line);
}
function defineGrammar(grammarBuilder: InstanceType<typeof GrammarBuilder>) {
    const type = grammarBuilder.constructRuleDefinition("path_type", "Path type",
        `"undirected"i {return "-"}
    / "directed"i {return "->"}
    / query_edge_type`
    );
    grammarBuilder.defineGrammarFragment(type.declaration);
    const expression = `("create" sp+)? type:(t:${type.name} sp+ {return t})? ("line"i / "line"i) sp+ "with"i sp+ n:Integer sp+ type2:(t:${type.name} sp+ {return t})? "nodes" type3:(sp+  t:${type.name} {return t})? {return {type: "query", keyword:"constructor_line", parameters: [n,(type || type2 || type3)]}}`;
    grammarBuilder.defineGrammarQuery("nodes_and_edges", "constructor_query_line", "Query: Create Line with n nodes and (n-1) edges", expression);
}

// Layout extension Registration
// 1. Access Loader - 2. Create declaration Object - 3. Register Extension
let loader = (window as { [key: string]: any })[ProtoGraphLoaderNamespace];
let declaration: ExtensionDeclaration = { name: "constructor_query_line", exec: init, grammar: defineGrammar, docs };
loader.register(declaration);


////////////////////////////////////////////////////////////////////////////////




//////////////////////////// Specific Extension Logic ////////////////////////////


// Extension logic
const constructor_line: QueryHandler = ({ core, parser, parameters, namedParameters, properties, line }) => {
    if (!core.cy) throw Error("Cytoscape not initialized");
    const typedParameters = parameters as [number, edgeMarker | undefined];
    const type = typedParameters[1];
    const quantity: number = typedParameters[0];
    // console.log("LINE CONSTRUCTOR: nodes", quantity, line, parameters)
    const idGenerator = core.getUtility("IdGenerator") as IdGenerator;
    const nodes = [...Array(quantity).fill(0)].map(_ => {
        const id = idGenerator.createId();
        return { group: 'nodes', data: { id, label: id, ...namedParameters }, style: { label: id } }
    });
    const edges = [];
    for (let i = 0; i < nodes.length - 1; i++) {
        const id = idGenerator.createId("e");
        let fromSet: string;
        let toSet: string;
        let leftSet = nodes[i].data.id;
        let rightSet = nodes[i+1].data.id;
        // Directionality
        let edgeType: edgeType;
        if (type === "->" || type === "to") {
            edgeType = "directed";
            fromSet = leftSet;
            toSet = rightSet;
        } else if (type === "<-" || type === "from") {
            edgeType = "directed";
            // Switch directions
            fromSet = rightSet;
            toSet = leftSet;
        } else {
            edgeType = "undirected";
            fromSet = leftSet;
            toSet = rightSet;
        }
        edges.push({
            group: 'edges',
            data: {
                id,
                label: id,
                source: fromSet, // the source node id (edge comes from this node)
                target: toSet,  // the target node id (edge goes to this node),
                directed: String(edgeType === "directed")
            },
            style: {
                label: id
            }
        })
    }
    const eles = core.cy?.add([...nodes, ...edges] as cytoscape.ElementDefinition[]);
    return {
        type: "query_result",
        keyword: line.keyword,
        query_object: ["nodes", "edges"],
        data: eles,
        collection: eles
    }
}

///////////////////////////////////////////////////////////////////////////////


export const test = `
layout 
    name: grid

directed line with 3 nodes

line with 3 directed nodes

line with 3 nodes directed

line with 3 nodes ->
    color: red
line with 3 nodes -
    color: green
    
// notice this points to lower numbers as opposed to ascending numbers
line with 3 nodes <-
    color: blue
`;

// Extras
export default declaration;