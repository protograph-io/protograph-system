"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var config_1 = require("../config");
var fattree_1 = __importDefault(require("../examples/fattree"));
var fattree_2_png_1 = __importDefault(require("../examples/fattree-2.png"));
function init(core) {
    core.defineHandler('query', "constructor_fattree", constructor_fattree);
}
function defineGrammar(grammarBuilder) {
    var expression = "(\"create fattree\"i / \"fattree\"i) {return {type: \"query\", keyword:\"constructor_fattree\", parameters: []}}";
    grammarBuilder.defineGrammarQuery("nodes_and_edges", "constructor_query_fattree", "Query: Create Fattree", expression);
}
var loader = window[config_1.ProtoGraphLoaderNamespace];
var declaration = {
    name: "constructor_query_fattree",
    exec: init,
    grammar: defineGrammar,
    docs: {
        name: "Fattree",
        description: "Generates a 4 core / 16 host fattree topology.",
        category: "query_constructor",
        keywords: ["networking"],
        image: fattree_2_png_1.default,
        usage: [{
                name: "Basic",
                codeExample: "fattree"
            }, {
                name: "Extended (Same As Template)",
                description: "Provides insight into how the fattree constructor can be paried with the select query or the path query to style the topology.",
                codeExample: fattree_1.default
            }]
    }
};
loader.register(declaration);
var input = "\n// Creates 4 pods with 4 items\nforeach pod in (1,2,3,4): for level in (agg, edge) : for side in (left,right) : add 1 nodes\n    level: level\n    pod: pod\n    label: pod-level-side\n    side: side\n\n// Aign edge in pod and agg in pod\n//for each pod in (1,2,3,4): for level in (agg, edge) : align (nodes where pod = pod and level = level) horizontally\n\n\n//for pod in (1,2,3,4): for level in (left, right) : align (nodes where pod = pod and side = side) vertically\n\n// Connect pods with itself\nfor pod in (1,2,3,4) : connect (nodes where pod = pod) with (nodes where pod = pod)\n\nfor index,offset in (left,left,right,right) : add 1 nodes\n    offset: index\n    side: offset\n    level: core\n    label: core-index-offset\n\nfor side in (left, right): connect (nodes where side = side and level = agg) with (nodes where level = core and side = side)\n\n\n\n//separate (nodes where level = agg) (nodes where level = edge) vertically 50\n\n\nfor each index, edge in (nodes where level = edge) : for side in (left, right) : add 1 nodes\n    edge : index\n    label : host-index\n    level: host\n    side: side\n\n\nfor each index, edge in (nodes where level = edge) : connect edge with (nodes where edge = index)\n";
function createCores(core, parser, pod_number) {
    var input = "\n    add 2 nodes\n        level: edge\n        pod: " + pod_number + "\n    add 2 nodes\n        level: agg\n        pod: " + pod_number + "\n    ";
    return core.evaluate(parser.parse(input)[0].data[0]);
}
function createPod(core, parser, pod_number) {
    var input = "\n    add 2 nodes\n        level: edge\n        pod: " + pod_number + "\n    add 2 nodes\n        level: agg\n        pod: " + pod_number + "\n    ";
    return core.evaluate(parser.parse(input)[0].data[0]);
}
function alignHorizontally(layout, nodes, gap, equality) {
    if (gap === void 0) { gap = 50; }
    if (equality === void 0) { equality = false; }
    layout.addConstraint(nodes, "horizontal");
    for (var i = 0; i < nodes.length - 1; i++) {
        layout.addGapInequality(nodes[i], nodes[i + 1], "x", gap, String(equality), false);
    }
}
function alignEachVerticallyEach(layout, nodes1, nodes2, gap) {
    if (gap === void 0) { gap = 100; }
    for (var a = 0; a < nodes1.length; a += 2) {
        for (var b = 0; b < nodes2.length; b += 2) {
            layout.addGapInequality(nodes1[a], nodes2[b], "y", gap, "true", false);
        }
    }
}
var constructor_fattree = function (_a) {
    var core = _a.core, parser = _a.parser, parameters = _a.parameters, namedParameters = _a.namedParameters, properties = _a.properties, line = _a.line;
    if (!core.cy)
        throw Error("Cytoscape not initialized");
    var res = parser.parse(input)[0].data.map(function (line) { return core.evaluate(line); });
    var layout = core.getObject("layout_align");
    var rows = [core.cy.filter("node[level=\"core\"]"), core.cy.filter("node[level=\"agg\"]"), core.cy.filter("node[level=\"edge\"]"), core.cy.filter("node[level=\"host\"]")];
    var maxNodesInOneRow = Math.max.apply(Math, rows.map(function (row) { return row.size(); }));
    var maxWidth = maxNodesInOneRow * 50;
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        var gap = maxWidth / row.length;
        alignHorizontally(layout, row, gap);
        if (i > 0 && i < rows.length) {
            alignEachVerticallyEach(layout, rows[i - 1], row, 100);
        }
    }
    var collection = res.reduce(function (agg, item) {
        if (typeof item === "object" && "collection" in item && item.collection) {
            return agg.union(item.collection.size() ? item.collection : item.data);
        }
        return agg;
    }, core.cy.collection());
    return {
        type: "query_result",
        keyword: line.keyword,
        query_object: ["nodes"],
        data: collection,
        collection: collection
    };
};
exports.default = declaration;
