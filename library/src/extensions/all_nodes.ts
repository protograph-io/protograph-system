import { ProtoGraphLoaderNamespace } from "../config";
import { Core } from "../core/Core";
import { QueryHandler } from "../core/types";
import { ExtensionDeclaration, ExtensionDocsDecleration } from "../core/ExtensionLoader";
import { GrammarBuilder } from "../core/Parser";


/////////////////////////// Necessary For Any Extension ///////////////////////////

// The loader creates a store of all loaded/imported extensions.
// ... This does not install/define the extension for use in a core.
// The core.defineXXXXX is used to install the extension for a core instantiation.

const docs: ExtensionDocsDecleration = {
    name: "All Nodes",
    description: "Selects all nodes.",
    category: "query",
    keywords: ["basics"],
    usage: [{
        name: "Basic",
        codeExample: "all nodes"
    }, {
        name: "Basic with Properties",
        codeExample: `add nodes\n\tbackground-color: red`
    }, {
        name: "Creating a Fully Connected Graph with Connect/Edge Selector",
        description: "See full [example](example/query_all_nodes/full-connected).",
        codeExample: "connect all nodes with all nodes"
    }],
    extraPages: [
        {
            name: "Fully Connected",
            hash: "full-connected",
            description: "One way to quickly create a fully connected graph.",
            category: "example",
            keywords: [],
            dependencies: [],
            usage: [{
                name: "With ",
                codeExample: `add 6 nodes\nconnect all nodes with all nodes`
            }]
        },
        {
            name: "Node Color",
            hash: "background-color",
            description: "",
            category: "style",
            keywords: [],
            dependencies: [],
            usage: [{
                name: "background-color",
                description: "This sets the color of the node body.",
                codeExample: `n1\n\tbackground-color: blue`
            }, {
                name: "background (alias) ",
                description: "The background property sets the background-color of a node, the line-color of an edge, and the arrow-color of edge arrows.",
                codeExample: `n1\n\tbackground: blue`
            }]
        },
        {
            name: "Node & Edge Label",
            hash: "label",
            description: "The label is the text on top of a node of label. This is useful for naming what nodes or edges represent. However sometimes they can be distracting or visually messy so you can remove them with `label: \"\"`. Alternatively you can set it to any value.\n\n Note: the default label is the node or edge id which is specified when creating the node or label.",
            category: "style",
            keywords: [],
            dependencies: [],
            usage: [{
                name: "Empty Label (Node)",
                // description: "This sets the color of the node body.",
                codeExample: `n1\n\tlabel: ""`
            },
            {
                name: "Custom Label (Node)",
                // description: "This sets the color of the node body.",
                codeExample: `n1\n\tlabel: "my custom label"`
            }, {
                name: "Empty Label (Edge)",
                // description: "This sets the color of the node body.",
                codeExample: `all edges\n\tlabel: ""`
            },
            {
                name: "Custom Label (Edge)",
                // description: "This sets the color of the node body.",
                codeExample: `n1 to n2\n\tlabel: "my custom label"`
            },
            {
                name: "Custom Label During Creation (Node)",
                description: "A node's id and label can be specified when you create the node.",
                codeExample: `add "node with custom label"`
            },
            {
                name: "Default Generated Label (Node)",
                description: "The add command creates nodes with an id and label that starts with \"n\" and counts up.",
                codeExample: `add 1 node\n# labels: n1,n2,n3,...`
            },
            {
                name: "Default Generated Label (Edge)",
                description: "The connect command creates edges with an id and label that starts with \"e\" and counts up.",
                codeExample: `connect n1 to n2\n# labels: e1,e2,e3,...`
            }]
        },
        {
            name: "Node Shape",
            hash: "shape",
            description: "",
            category: "style",
            keywords: [],
            dependencies: [],
            usage: [{
                name: "shape (square)",
                description: "The shape of the node’s body. Note that each shape fits within the specified width and height, and so you may have to adjust width and height if you desire an equilateral shape (i.e. width !== height for several equilateral shapes). Only *rectangle* shapes are supported by compounds, because the dimensions of a compound are defined by the bounding box of the children.",
                codeExample: `n1\n\tshape: square`
            },
            {
                name: "shape (ellipse)",
                description: "The shape of the node’s body. Note that each shape fits within the specified width and height, and so you may have to adjust width and height if you desire an equilateral shape (i.e. width !== height for several equilateral shapes). Only *rectangle* shapes are supported by compounds, because the dimensions of a compound are defined by the bounding box of the children.",
                codeExample: `n1\n\tshape: ellipse`
            }]
        },
        {
            name: "Node Height",
            hash: "height",
            description: "",
            category: "style",
            keywords: [],
            dependencies: [],
            usage: [{
                name: "height",
                description: "The height of the node’s body.",
                codeExample: `n1\n\theight: 50`
            }]
        },
        {
            name: "Node Width",
            hash: "width",
            description: "",
            category: "style",
            keywords: [],
            dependencies: [],
            usage: [{
                name: "width",
                description: "The width of the node’s body.",
                codeExample: `n1\n\twidth: 200`
            }]
        },
        {
            name: "Edge Color",
            hash: "line-color",
            description: "",
            category: "style",
            keywords: [],
            dependencies: [],
            usage: [{
                name: "line-color ",
                description: "The color of the edge line.",
                codeExample: `n1\n\tline-color: blue`
            }, {
                name: "line-color (by edge id)",
                description: "The color of the edge line. Using the edge id as the selector.",
                codeExample: `e1,e2,e5\n\tline-color: blue`
            }, {
                name: "background (alias) ",
                description: "The background property sets the background-color of a node, the line-color of an edge, and the arrow-color of edge arrows.",
                codeExample: `a to b\n\tbackground: blue`
            }, {
                name: "color (alias) ",
                description: "The color property sets the label color, the line-color of an edge, and the arrow-color of edge arrows.",
                codeExample: `all edges\n\tcolor: blue`
            }]
        },
        {
            name: "Line Style (Solid/Dotted/Dashed)",
            hash: "line-style",
            description: "",
            category: "style",
            keywords: [],
            dependencies: [],
            usage: [{
                name: "line-style ",
                description: "The style of the edge line; \nOptions: solid, dotted, or dashed.",
                codeExample: `a to b\n\tline-style: dashed`
            }]
        },
        {
            name: "Arrow Shape",
            hash: "arrow-shape",
            description: "",
            category: "style",
            keywords: [],
            dependencies: [],
            usage: [{
                name: "target-arrow-shape ",
                description: "The shape of the edge’s target arrow. \nOptions: triangle, triangle-tee, circle-triangle, triangle-cross, triangle-backcurve, vee, tee, square, circle, diamond, chevron, none",
                codeExample: `a to b\n\ttarget-arrow-shape: square`
            },
            {
                name: "source-arrow-shape ",
                description: "The shape of the edge’s source arrow. \nOptions: triangle, triangle-tee, circle-triangle, triangle-cross, triangle-backcurve, vee, tee, square, circle, diamond, chevron, none",
                codeExample: `a to b\n\tsource-arrow-shape: circle`
            }]
        }
    ]
};


// Layout extension declaration
function init(core: InstanceType<typeof Core>) {
    core.defineHandler('query', "all_nodes", all_nodes);
}
function defineGrammar(grammarBuilder: InstanceType<typeof GrammarBuilder>) {
    const expression = `"all"i sp "nodes"i {return {type: "query", keyword:"all_nodes", parameters: []}}`;
    grammarBuilder.defineGrammarQuery("nodes", "query_all_nodes", "Query: Node: All Nodes", expression);
}
// Layout extension Registration
// 1. Access Loader - 2. Create declaration Object - 3. Register Extension
let loader = (window as { [key: string]: any })[ProtoGraphLoaderNamespace];
let declaration: ExtensionDeclaration = { name: "query_all_nodes", exec: init, grammar: defineGrammar, docs };
loader.register(declaration);


////////////////////////////////////////////////////////////////////////////////




//////////////////////////// Specific Extension Logic ////////////////////////////


// Extension logic
const all_nodes: QueryHandler = ({ core, parameters, namedParameters, properties, line }) => {
    const data = core.cy?.elements('node');
    return {
        type: "query_result",
        keyword: line.keyword,
        query_object: ["nodes"],
        data,
        collection: data
    }
}

///////////////////////////////////////////////////////////////////////////////


// Extras
export default declaration;