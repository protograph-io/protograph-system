import { ProtoGraphLoaderNamespace } from "../config";
var table = "| Edge Type | Long Hand | Short Hand |\n| :--------------------- | :----------------: | :----------------: |\n| Undirected | to | - |\n| Directed Forward | to | -> |\n| Directed Reverse | from | <- |";
var docs = {
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
function init(core) {
    core.defineHandler('query', "edge", edge);
}
function defineGrammar(grammarBuilder) {
    grammarBuilder.defineGrammarFragment("query_edge_type = \"to\"i / \"with\"i / \"<-\" / \"->\" / \"-\" / \"from\"i");
    var expression = "\n    left:(\n\t\tl:query_object_nodes sp* t:query_edge_type sp * {return [l,t]}\n    ) + right:(query_object_nodes) {return {type: \"query\", keyword: \"edge\", parameters:[...left,right].flat()}}\n    ";
    grammarBuilder.defineGrammarQuery("edges", "query_edge", "Query: Edge: [Node] [Type] [Node]", expression);
}
var loader = window[ProtoGraphLoaderNamespace];
var declaration = { name: "query_edge", exec: init, grammar: defineGrammar, docs: docs };
loader.register(declaration);
;
var edge = function (_a) {
    var core = _a.core, parameters = _a.parameters, nP = _a.namedParameters, properties = _a.properties, line = _a.line;
    if (parameters.length < 3 || parameters.length % 2 !== 1)
        throw Error("Incorrect Parameters");
    function getNodes(result) {
        if (!result.query_object.includes("nodes") || result.query_object.length !== 1)
            throw Error("Unsupported Parameters");
        return result.data.filter("node");
    }
    function directSets(leftSet, type, rightSet) {
        var fromSet;
        var toSet;
        var edgeType;
        if (type === "->" || type === "to") {
            edgeType = "directed";
            fromSet = leftSet;
            toSet = rightSet;
        }
        else if (type === "<-" || type === "from") {
            edgeType = "directed";
            fromSet = rightSet;
            toSet = leftSet;
        }
        else {
            edgeType = "undirected";
            fromSet = leftSet;
            toSet = rightSet;
        }
        return { fromSet: fromSet, toSet: toSet, edgeType: edgeType };
    }
    function getExistingEdges(_a) {
        var fromSet = _a.fromSet, edgeType = _a.edgeType, toSet = _a.toSet;
        var existingEdges;
        if (edgeType === "undirected") {
            existingEdges = fromSet.edgesWith(toSet).filter("[directed = 'false']");
        }
        else {
            existingEdges = fromSet.edgesTo(toSet).filter("[directed = 'true']");
        }
        return existingEdges;
    }
    function generateSpecifiedEdges(_a) {
        var fromSet = _a.fromSet, edgeType = _a.edgeType, toSet = _a.toSet;
        var edges = [];
        fromSet.forEach(function (leftNode) {
            toSet.forEach(function (rightNode) {
                if (leftNode === rightNode && (fromSet.size() > 1 || toSet.size() > 1))
                    return;
                if ((edgeType === "undirected")
                    &&
                        edges.some(function (e) { return e.source === rightNode.id() && e.target === leftNode.id(); }))
                    return;
                edges.push({ source: leftNode.id(), target: rightNode.id() });
            });
        });
        return edges;
    }
    function filterExistingFromSpecifiedEdges(specified, _a) {
        var fromSet = _a.fromSet, edgeType = _a.edgeType, toSet = _a.toSet;
        var edges = specified.filter(function (edge) {
            if (!core.cy)
                throw Error("Core Cytoscape not Initialized");
            if (edgeType === "undirected") {
                var con = core.cy.$("edge[source = \"" + edge.source + "\"][target = \"" + edge.target + "\"][directed = 'false'],\n                        edge[source = \"" + edge.target + "\"][target = \"" + edge.source + "\"][directed = 'false']").empty();
                return con;
            }
            else {
                var con = core.cy.$("edge[source = \"" + edge.source + "\"][target = \"" + edge.target + "\"][directed = 'true']").empty();
                return con;
            }
        });
        return edges;
    }
    function createMissingEdges(edges, _a) {
        var fromSet = _a.fromSet, edgeType = _a.edgeType, toSet = _a.toSet;
        var idGenerator = core.getUtility("IdGenerator");
        if (!core.cy)
            throw Error("Core Cytoscape not Initialized");
        var added = core.cy.add(edges.map(function (e) {
            var id = idGenerator.createId("e");
            return {
                group: 'edges',
                data: {
                    id: id,
                    label: id,
                    source: e.source,
                    target: e.target,
                    directed: String(edgeType === "directed")
                },
                style: {
                    label: id
                }
            };
        }));
        return added;
    }
    if (!core.cy)
        throw Error("Core Cytoscape not Initialized");
    var data = core.cy.collection();
    for (var i = 2; i < parameters.length; i += 2) {
        var leftSet = getNodes(parameters[i - 2]);
        var edgeMarker = parameters[i - 1];
        var rightSet = getNodes(parameters[i]);
        var setSpec = directSets(leftSet, edgeMarker, rightSet);
        var existing = getExistingEdges(setSpec);
        var specified = generateSpecifiedEdges(setSpec);
        var missing = filterExistingFromSpecifiedEdges(specified, setSpec);
        var created = createMissingEdges(missing, setSpec);
        data = data.union(existing).union(created);
    }
    return {
        type: "query_result",
        keyword: line === null || line === void 0 ? void 0 : line.keyword,
        query_object: ["edges"],
        data: data,
        collection: data
    };
};
export default declaration;
