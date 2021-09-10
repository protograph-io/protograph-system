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
var forms = [
    "directed line with 6 nodes",
    "line with 6 directed nodes",
    "line with 6 nodes directed",
];
var generateMarkdownCode = function (code) { return "```\n" + code + "\n```"; };
var docs = {
    name: "Line",
    description: "Creates a line or path graph with (n) nodes and (n-1) nodes. Default undirected.\n    ### Form \n    ```\n    [create]? line with [number] nodes [directed / undirected / <- / - / ->]\n    ```",
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
            description: "The type of edge can be specified in a number of places. An edge type can be `directed / undirected / <- / - / ->`.\n" + forms.map(function (f) { return generateMarkdownCode(f); }).join("\n")
        }]
};
function init(core) {
    core.defineHandler('query', "constructor_line", constructor_line);
}
function defineGrammar(grammarBuilder) {
    var type = grammarBuilder.constructRuleDefinition("path_type", "Path type", "\"undirected\"i {return \"-\"}\n    / \"directed\"i {return \"->\"}\n    / query_edge_type");
    grammarBuilder.defineGrammarFragment(type.declaration);
    var expression = "(\"create\" sp+)? type:(t:" + type.name + " sp+ {return t})? (\"line\"i / \"line\"i) sp+ \"with\"i sp+ n:Integer sp+ type2:(t:" + type.name + " sp+ {return t})? \"nodes\" type3:(sp+  t:" + type.name + " {return t})? {return {type: \"query\", keyword:\"constructor_line\", parameters: [n,(type || type2 || type3)]}}";
    grammarBuilder.defineGrammarQuery("nodes_and_edges", "constructor_query_line", "Query: Create Line with n nodes and (n-1) edges", expression);
}
var loader = window[ProtoGraphLoaderNamespace];
var declaration = { name: "constructor_query_line", exec: init, grammar: defineGrammar, docs: docs };
loader.register(declaration);
var constructor_line = function (_a) {
    var _b;
    var core = _a.core, parser = _a.parser, parameters = _a.parameters, namedParameters = _a.namedParameters, properties = _a.properties, line = _a.line;
    if (!core.cy)
        throw Error("Cytoscape not initialized");
    var typedParameters = parameters;
    var type = typedParameters[1];
    var quantity = typedParameters[0];
    var idGenerator = core.getUtility("IdGenerator");
    var nodes = __spreadArray([], Array(quantity).fill(0)).map(function (_) {
        var id = idGenerator.createId();
        return { group: 'nodes', data: __assign({ id: id, label: id }, namedParameters), style: { label: id } };
    });
    var edges = [];
    for (var i = 0; i < nodes.length - 1; i++) {
        var id = idGenerator.createId("e");
        var fromSet = void 0;
        var toSet = void 0;
        var leftSet = nodes[i].data.id;
        var rightSet = nodes[i + 1].data.id;
        var edgeType = void 0;
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
        edges.push({
            group: 'edges',
            data: {
                id: id,
                label: id,
                source: fromSet,
                target: toSet,
                directed: String(edgeType === "directed")
            },
            style: {
                label: id
            }
        });
    }
    var eles = (_b = core.cy) === null || _b === void 0 ? void 0 : _b.add(__spreadArray(__spreadArray([], nodes), edges));
    return {
        type: "query_result",
        keyword: line.keyword,
        query_object: ["nodes", "edges"],
        data: eles,
        collection: eles
    };
};
export var test = "\nlayout \n    name: grid\n\ndirected line with 3 nodes\n\nline with 3 directed nodes\n\nline with 3 nodes directed\n\nline with 3 nodes ->\n    color: red\nline with 3 nodes -\n    color: green\n    \n// notice this points to lower numbers as opposed to ascending numbers\nline with 3 nodes <-\n    color: blue\n";
export default declaration;
