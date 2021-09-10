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
import { ProtoGraphLoaderNamespace } from "../config";
var example = "a1 -> a2 <- a3\n\ndraw start a1 -> a2\n\nstep\n\ndraw end a1 -> a2";
var exampleRetract = "a1 -> a2 <- a3\n\ndraw end a1 -> a2\n\nstep\n\ndraw start a1 -> a2";
var docs = {
    name: "Draw",
    description: "A command to make it easier to animate the drawing of an edge from one node to another. Set `start` when you want to hide the edge and `end` when you want to draw the edge. Reverse `end` and `start` to show the edge retracting. \n\n ### Details\nApplies 'target-distance-from-node': \"900%\" and 'source-distance-from-node': '0%' to hide the edge and 'target-distance-from-node': '0%' and 'source-distance-from-node': '0%' to animate drawing the edge.",
    category: "command",
    keywords: ["basics"],
    usage: [{
            name: "Basic",
            dependencies: ["query_edge"],
            codeExample: example
        },
        {
            name: "Retract Edge",
            dependencies: ["query_edge"],
            codeExample: exampleRetract
        }]
};
function init(core) {
    core.defineHandler('command', "draw", draw);
}
function defineGrammar(grammarBuilder) {
    var expression = "\"draw\"i sp+ seq:(\"start\"i/\"end\"i) sp+ p:query_object_edges { return {keyword: \"draw\", parameters:[seq,p] } }";
    grammarBuilder.defineGrammarCommand("draw", "Path [Edge Query]", expression);
}
function defineAutoComplete(autoCompleteRulesBuilder) {
    autoCompleteRulesBuilder.defineLineStart({ firstWord: "draw", displayText: "draw [edge query]", description: "Animates an edge from its source to sink" });
}
var loader = window[ProtoGraphLoaderNamespace];
var declaration = { name: "command_draw", exec: init, grammar: defineGrammar, autocomplete: defineAutoComplete, docs: docs };
loader.register(declaration);
var draw = function (_a) {
    var _b, _c;
    var core = _a.core, parameters = _a.parameters;
    console.log("DRAW", parameters);
    var seq = parameters[0].toString().toLowerCase();
    var query1 = parameters[1];
    var edges = ((_b = query1.collection) === null || _b === void 0 ? void 0 : _b.filter("edge")) || ((_c = core.cy) === null || _c === void 0 ? void 0 : _c.collection());
    return __assign(__assign({}, query1), { collection: edges, data: edges, extraCollectionProperties: ((seq === "start") ?
            {
                'target-distance-from-node': "900%",
                'source-distance-from-node': '0%'
            } : {
            'target-distance-from-node': '0%',
            'source-distance-from-node': '0%'
        }) });
};
export default declaration;
