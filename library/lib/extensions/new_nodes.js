var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
import { ProtoGraphLoaderNamespace } from "../config";
function init(core) {
    core.defineHandler('query', "new_nodes", new_nodes);
}
function defineGrammar(grammarBuilder) {
    var expression = "q:number sp \"nodes\"i {return {type: \"query\", keyword:\"new_nodes\", parameters: [parseInt(q)]}}";
    grammarBuilder.defineGrammarQuery("nodes", "query_new_nodes", "Query: Node: [number] Nodes", expression);
}
var loader = window[ProtoGraphLoaderNamespace];
var declaration = { name: "query_new_nodes", exec: init, grammar: defineGrammar };
loader.register(declaration);
var new_nodes = function (_a) {
    var _b;
    var core = _a.core, parameters = _a.parameters, namedParameters = _a.namedParameters, properties = _a.properties, line = _a.line;
    var typedParameters = parameters;
    var quantity = typedParameters[0];
    var idGenerator = core.getUtility("IdGenerator");
    var nodes = __spreadArray([], Array(quantity).fill(0)).map(function (_) {
        var id = idGenerator.createId();
        return { group: 'nodes', data: __assign({ id: id, label: id }, namedParameters), style: { label: id } };
    });
    var eles = (_b = core.cy) === null || _b === void 0 ? void 0 : _b.add(nodes);
    return {
        type: "query_result",
        keyword: line.keyword,
        query_object: ["nodes"],
        data: eles,
        collection: eles
    };
};
export default declaration;
