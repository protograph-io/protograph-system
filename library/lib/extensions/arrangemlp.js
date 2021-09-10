import { ProtoGraphLoaderNamespace } from "../config";
function init(core) {
    core.defineHandler('command', "arrangemlp", arrangemlp);
}
function defineGrammar(grammarBuilder) {
    var expression = "\"arrangemlp\"i { return {keyword: \"arrangemlp\", parameters:[] } }";
    grammarBuilder.defineGrammarCommand("arrangemlp", "Arrangemlp", expression);
}
function defineAutoComplete(autoCompleteRulesBuilder) {
    autoCompleteRulesBuilder.defineLineStart({ firstWord: "arrangemlp", displayText: "arrangemlp", description: "Arrange a Multi-Layer Perceptron" });
}
var loader = window[ProtoGraphLoaderNamespace];
var declaration = { name: "command_arrangemlp", exec: init, grammar: defineGrammar, autocomplete: defineAutoComplete };
loader.register(declaration);
var arrangemlp = function (_a) {
    var _b;
    var core = _a.core, parameters = _a.parameters;
    var nodeCollection = (_b = core.cy) === null || _b === void 0 ? void 0 : _b.elements().nodes();
    if (nodeCollection === undefined || nodeCollection.size() === 0) {
        return;
    }
    var px = 100;
    var layers = nodeCollection.map(function (node) { return Number(node.attr('layer')); }).filter(function (v) { return !Number.isNaN(v); });
    var total_layers = Math.max.apply(Math, layers);
    var layerDict = {};
    var _loop_1 = function (i) {
        layerDict[i] = nodeCollection.filter(function (node) { return Number(node.attr('layer')) === i; });
    };
    for (var i = 1; i <= total_layers; i++) {
        _loop_1(i);
    }
    var max_nodes = 0;
    for (var key in layerDict) {
        var numNodes = layerDict[key].size();
        max_nodes = numNodes > max_nodes ? numNodes : max_nodes;
    }
    var max_center_pixels = (max_nodes - 1) * px / 2;
    var _loop_2 = function (key) {
        var nc = layerDict[key];
        var center_pixels = (nc.size() - 1) * px / 2;
        var offset = max_center_pixels - center_pixels;
        nc.positions(function (node, i) {
            return {
                x: px * Number(key),
                y: (i * px) + offset
            };
        });
    };
    for (var key in layerDict) {
        _loop_2(key);
    }
};
export default declaration;
