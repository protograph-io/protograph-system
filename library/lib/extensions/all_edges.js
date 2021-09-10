import { ProtoGraphLoaderNamespace } from "../config";
var docs = {
    name: "All Edges",
    description: "Selects all edges.",
    category: "query",
    keywords: ["basics"],
    usage: [{
            name: "Basic",
            codeExample: "all edges"
        }, {
            name: "Basic with Properties",
            codeExample: "add edges\n    line-color: red"
        }]
};
function init(core) {
    core.defineHandler('query', "all_edges", all_edges);
}
function defineGrammar(grammarBuilder) {
    var expression = "\"all edges\"i {return {type: \"query\", keyword:\"all_edges\", parameters: []}}";
    grammarBuilder.defineGrammarQuery("edges", "query_all_edges", "Query: Edge: All Edges", expression);
}
var loader = window[ProtoGraphLoaderNamespace];
var declaration = { name: "query_all_edges", exec: init, grammar: defineGrammar, docs: docs };
loader.register(declaration);
var all_edges = function (_a) {
    var _b;
    var core = _a.core, line = _a.line;
    var data = (_b = core.cy) === null || _b === void 0 ? void 0 : _b.elements('edge');
    return {
        type: "query_result",
        keyword: line.keyword,
        query_object: ["edges"],
        data: data,
        collection: data
    };
};
export default declaration;
