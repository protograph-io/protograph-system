import { ProtoGraphLoaderNamespace } from "../config";
function init(core) {
    core.defineHandler('command', "path", path);
    core.defineHandler('query', "path", path);
}
function defineGrammar(grammarBuilder) {
    var expression = "\"path\"i sp p:query_object_nodes sp \"to\"i sp q:query_object_nodes { return {keyword: \"path\", parameters:[p, q] } }";
    grammarBuilder.defineGrammarCommand("path", "Path [Query] to [Query]", expression);
    var expressionQuery = "\"path\"i sp p:query_object_nodes sp \"to\"i sp q:query_object_nodes { return {type: \"query\", keyword: \"path\", parameters:[p, q] } }";
    grammarBuilder.defineGrammarQuery("edges", "sql_select_query_edges", "Path [Query] to [Query]", expressionQuery);
}
function defineAutoComplete(autoCompleteRulesBuilder) {
    autoCompleteRulesBuilder.defineLineStart({ firstWord: "path", displayText: "path [node query]", description: "Get path between two nodes" });
}
var loader = window[ProtoGraphLoaderNamespace];
var declaration = { name: "command_path", exec: init, grammar: defineGrammar, autocomplete: defineAutoComplete };
loader.register(declaration);
var path = function (_a) {
    var _b;
    var core = _a.core, parameters = _a.parameters;
    if (!core.cy)
        throw Error("Cytoscape not initialized");
    var query1 = parameters[0];
    var query2 = parameters[1];
    console.log(parameters);
    if (query1.collection == null || query2.collection == null) {
        console.log("CALLING PATH QUIT 1", parameters);
        return {
            type: "query_result",
            keyword: "path",
            query_object: ["edges"],
            data: core.cy.collection(),
            collection: core.cy.collection()
        };
    }
    var nodeCollection1 = query1.collection.nodes();
    var nodeCollection2 = query2.collection.nodes();
    if (nodeCollection1.size() < 1 || nodeCollection2.size() < 1) {
        console.log("CALLING PATH QUIT 2", parameters);
        return {
            type: "query_result",
            keyword: "path",
            query_object: ["edges"],
            data: core.cy.collection(),
            collection: core.cy.collection()
        };
    }
    var startElement = nodeCollection1[0];
    var endElement = nodeCollection2[0];
    var fw = (_b = core.cy) === null || _b === void 0 ? void 0 : _b.elements().floydWarshall({
        weight: function (edge) {
            return 1;
        }
    });
    var data = fw === null || fw === void 0 ? void 0 : fw.path(startElement, endElement).filter(function (ele) { return ele.isEdge(); });
    console.log(data);
    console.log("CALLING PATH", parameters, data);
    return {
        type: "query_result",
        keyword: "path",
        query_object: ["edges"],
        data: data,
        collection: data
    };
};
export default declaration;
