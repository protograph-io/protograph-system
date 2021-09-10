import { ProtoGraphLoaderNamespace } from "../config";
import { Core } from "../core/Core";
import { QueryHandler } from "../core/types";
import { ExtensionDeclaration, ExtensionDocsDecleration } from "../core/ExtensionLoader";
import { GrammarBuilder } from "../core/Parser";
import { BaseQueries } from "../core/types";
import { Grammar } from "../grammar/grammar.types";
import { IdGenerator } from "./id_generator";


/////////////////////////// Necessary For Any Extension ///////////////////////////

// The loader creates a store of all loaded/imported extensions.
// ... This does not install/define the extension for use in a core.
// The core.defineXXXXX is used to install the extension for a core instantiation.

const table = `| Edge Type | Long Hand | Short Hand |
| :--------------------- | :----------------: | :----------------: |
| Undirected | to | - |
| Directed Forward | to | -> |
| Directed Reverse | from | <- |`
const docs: ExtensionDocsDecleration = {
    name: "Edge",
    description: "Looks for an existing edge or creates one between two nodes. Can be directed or undirected.\n" + table,
    category: "query",
    keywords: ["basics"],
    usage: [{
        name: "Undirected",
        codeExample: "n1 with n2",
    }, {
        name: "Forward Edge",
        codeExample: "n1 to n2",
    }, {
        name: "Reverse Edge",
        codeExample: "n1 from n2",
    }, {
        name: "Shorthand: Undirected",
        codeExample: "n1 - n2",
    }, {
        name: "Shorthand: Forward Edge",
        codeExample: "n1 -> n2",
    }, {
        name: "Shorthand: Reverse Edge",
        codeExample: "n1 <- n2",
    }, {
        name: "Selecting an Existing Edge by Id",
        description: "When an edge is created it is automatically assigned an id. This id can be used to select an edge like you would a node.\n\nThe edge id is the default edge label. An edge's id can also be found by hovering over the edge and reading the id listed in the tooltip that appears.",
        codeExample: "e1\n\tline-color: green",
    }, {
        name: "Selecting Multiple Existing Edge by Id",
        codeExample: "e1, e2, e3\n\tline-color: green",
    }]
};

// Layout extension declaration
function init(core: InstanceType<typeof Core>) {
    core.defineHandler('query', "edge", edge);
}
function defineGrammar(grammarBuilder : InstanceType<typeof GrammarBuilder>) {
    grammarBuilder.defineGrammarFragment(`query_edge_type = "to"i / "with"i / "<-" / "->" / "-" / "from"i`);
    const expression = `
    left:(
		l:query_object_nodes sp* t:query_edge_type sp * {return [l,t]}
    ) + right:(query_object_nodes) {return {type: "query", keyword: "edge", parameters:[...left,right].flat()}}
    `;
    grammarBuilder.defineGrammarQuery("edges", "query_edge", "Query: Edge: [Node] [Type] [Node]", expression);
}

// Layout extension Registration
// 1. Access Loader - 2. Create declaration Object - 3. Register Extension
let loader = (window as { [key: string]: any })[ProtoGraphLoaderNamespace];
let declaration : ExtensionDeclaration = { name: "query_edge", exec: init, grammar: defineGrammar, docs };
loader.register(declaration);


////////////////////////////////////////////////////////////////////////////////




//////////////////////////// Specific Extension Logic ////////////////////////////


// Extension logic
export interface EdgeQuery {
    type: "query",
    keyword: "edge",
    namedParameters: {
        left: Grammar.Query;
        right: Grammar.Query;
        type: string;
    }
};
export type edgeMarker = "to" | "with" | "<-" | "->" | "-" | "from";
export type edgeType = 'undirected' | 'directed';
type edgeSetSpec = { fromSet: cytoscape.NodeCollection, edgeType: edgeType, toSet: cytoscape.NodeCollection };
type edgeSpec = { source: string, target: string };
const edge: QueryHandler = ({core, parameters, namedParameters:nP, properties, line}) => {

    if (parameters.length < 3 || parameters.length % 2 !== 1) throw Error("Incorrect Parameters");

    function getNodes(result: BaseQueries.Result) {
        if (!result.query_object.includes("nodes") || result.query_object.length !== 1) throw Error("Unsupported Parameters");
        return result.data.filter("node");
    }
    function directSets(leftSet: cytoscape.NodeCollection, type: edgeMarker, rightSet: cytoscape.NodeCollection): edgeSetSpec {
        let fromSet: cytoscape.NodeCollection;
        let toSet: cytoscape.NodeCollection;

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

        return { fromSet, toSet, edgeType };
    }
    function getExistingEdges({ fromSet, edgeType, toSet }: edgeSetSpec): cytoscape.EdgeCollection {
        let existingEdges: cytoscape.EdgeCollection;
        if (edgeType === "undirected") {
            existingEdges = fromSet.edgesWith(toSet).filter("[directed = 'false']");
        } else {
            existingEdges = fromSet.edgesTo(toSet).filter("[directed = 'true']");
        }
        return existingEdges;
    }
    function generateSpecifiedEdges({ fromSet, edgeType, toSet }: edgeSetSpec): edgeSpec[] {
        let edges: edgeSpec[] = [];
        fromSet.forEach(
            (leftNode: cytoscape.NodeSingular) => {
                toSet.forEach(
                    (rightNode: cytoscape.NodeSingular) => {
                        // Debate: commented allows self loops, uncommented allows easy fully connected
                        if (leftNode === rightNode && (fromSet.size() > 1 || toSet.size() > 1)) return; // Only self loop if both sets are size 1
                        // If undirected edge, dont add twice
                        if ((edgeType === "undirected")
                            &&
                            edges.some(e => e.source === rightNode.id() && e.target === leftNode.id())
                        ) return;
                        edges.push({ source: leftNode.id(), target: rightNode.id() });
                    }
                )
            }
        )
        return edges;
    }
    function filterExistingFromSpecifiedEdges(specified: edgeSpec[], { fromSet, edgeType, toSet }: edgeSetSpec): edgeSpec[] {
        const edges = specified.filter(edge => {
            if (!core.cy) throw Error("Core Cytoscape not Initialized");
            if (edgeType === "undirected") {
                // get both directions
                const con = core.cy.$(
                    `edge[source = "${edge.source}"][target = "${edge.target}"][directed = 'false'],
                        edge[source = "${edge.target}"][target = "${edge.source}"][directed = 'false']`
                ).empty();
                return con;
            } else {
                const con = core.cy.$(`edge[source = "${edge.source}"][target = "${edge.target}"][directed = 'true']`).empty();
                return con;
            }
        });
        return edges;
    }
    function createMissingEdges(edges: edgeSpec[], { fromSet, edgeType, toSet }: edgeSetSpec): cytoscape.EdgeCollection {
        const idGenerator = core.getUtility("IdGenerator") as IdGenerator;
        if (!core.cy) throw Error("Core Cytoscape not Initialized");
        let added = core.cy.add(edges.map(e => {
            const id = idGenerator.createId("e");
            return {
                group: 'edges',
                data: {
                    id,
                    label: id,
                    source: e.source,
                    target: e.target,
                    directed: String(edgeType === "directed")
                },
                style: {
                    label: id
                }
            }
        }))
        return added;
    }



    if (!core.cy) throw Error("Core Cytoscape not Initialized");
    let data: cytoscape.Collection = core.cy.collection();
    for (let i = 2; i < parameters.length; i += 2) {
        let leftSet = getNodes(parameters[i - 2] as BaseQueries.Result);
        let edgeMarker: edgeMarker = parameters[i - 1] as edgeMarker;
        let rightSet = getNodes(parameters[i] as BaseQueries.Result);

        const setSpec = directSets(leftSet, edgeMarker, rightSet);

        const existing = getExistingEdges(setSpec)
        const specified = generateSpecifiedEdges(setSpec)
        const missing = filterExistingFromSpecifiedEdges(specified, setSpec)
        const created = createMissingEdges(missing, setSpec);

        // Keep track of all created edges
        // ... return as collection and data for properties etc
        data = data.union(existing).union(created);
    }


    // log("query: edge ", "status: end", data);
    return {
        type: "query_result",
        keyword: line?.keyword,
        query_object: ["edges"],
        data,
        collection: data
    }
}

///////////////////////////////////////////////////////////////////////////////


// Extras
export default declaration;