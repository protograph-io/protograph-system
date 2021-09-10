import { ProtoGraphLoaderNamespace } from "../config";
function init(core) {
    core.defineHandler('query', "node", node);
}
function defineGrammar(grammarBuilder) {
    var expression = "p:(anyword) {return {type: \"query\", keyword: \"node\", parameters:[p]}}";
    grammarBuilder.defineGrammarQuery("nodes_id", "node_by_id", "Query: Node: Node Id", expression);
    grammarBuilder.defineGrammarQuery("nodes", "node_by_id", "Query: Node: Node Id", expression);
}
var loader = window[ProtoGraphLoaderNamespace];
var declaration = { name: "query_node", exec: init, grammar: defineGrammar };
loader.register(declaration);
export var node = function (_a) {
    var core = _a.core, parameters = _a.parameters, namedParameters = _a.namedParameters, properties = _a.properties, line = _a.line;
    if (!core.cy)
        throw Error("Core Cytoscape not initialized");
    var cy = core.cy;
    var id = parameters[0];
    var node = cy.$("#" + id);
    if (node === null || node === void 0 ? void 0 : node.empty()) {
        node = cy.add({ group: 'nodes', data: { id: id, label: id }, style: { label: id } });
    }
    return {
        type: "query_result",
        keyword: line.keyword,
        query_object: ["nodes"],
        data: node,
        collection: node
    };
};
export default declaration;
