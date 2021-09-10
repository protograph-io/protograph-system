var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
import { ProtoGraphLoaderNamespace } from "../config";
import { isObjAndHas } from "../core/helpers";
var docs = {
    name: "Selecting Multiple Nodes/Edges",
    description: "You can select multiple nodes or edges by listing their ids in a comma seperated list.",
    category: "query",
    keywords: ["basics"],
    usage: [{
            name: "Multiple Nodes",
            codeExample: "n1,n2,n5\n\tbackground-color: red"
        }, {
            name: "Multiple Edges",
            codeExample: "e1,e2,e5\n\tbackground-color: red"
        }]
};
function init(core) {
    var union = function (_a) {
        var core = _a.core, parameters = _a.parameters, namedParameters = _a.namedParameters, properties = _a.properties, line = _a.line;
        if (!parameters.every(function (p) { return isObjAndHas(p, "data"); }))
            throw Error("Unsupported parameters");
        if (!parameters.every(function (p) { return isObjAndHas(p, "query_object"); }))
            throw Error("Unsupported parameters");
        var pars = parameters;
        var data = pars
            .map(function (p) { return p.data; })
            .reduce(function (agg, item) { return agg.union(item); });
        var objects = pars
            .map(function (p) { return p.query_object; })
            .reduce(function (agg, item) { return __spreadArray(__spreadArray([], agg), item); }, []);
        return {
            type: "query_result",
            keyword: line.keyword,
            query_object: __spreadArray([], Array.from(new Set(objects))),
            data: data,
            collection: data
        };
    };
    core.defineHandler('query', "union", union);
}
function defineGrammar(grammarBuilder) {
    var expression = "ns:(n1: query_object_nodes_id sp? \",\" sp? {return n1})* n2:query_object_nodes_id \n\t{return {type: \"query\", keyword: \"union\", parameters: [...ns, n2]}}";
    grammarBuilder.defineGrammarQuery("nodes", "query_union", "Query: Node: Node Id, Node Id, ...", expression);
}
var loader = window[ProtoGraphLoaderNamespace];
var declaration = { name: "query_union", exec: init, grammar: defineGrammar, docs: docs };
loader.register(declaration);
export default declaration;
