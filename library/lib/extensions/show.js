import { ProtoGraphLoaderNamespace } from "../config";
function init(core) {
    core.defineHandler('command', "show", show);
}
function defineGrammar(grammarBuilder) {
    var expression = "\"show\"i sp p:query { return {keyword: \"show\", parameters:[p] } }";
    grammarBuilder.defineGrammarCommand("show", "Show [Query]", expression);
}
function defineAutoComplete(autoCompleteRulesBuilder) {
    autoCompleteRulesBuilder.defineLineStart({ firstWord: "show", displayText: "show [node query / edge query]", description: "Show hidden nodes or hidden edges in your graph." });
}
var loader = window[ProtoGraphLoaderNamespace];
var declaration = { name: "command_show", exec: init, grammar: defineGrammar, autocomplete: defineAutoComplete };
loader.register(declaration);
var show = function (_a) {
    var _b;
    var core = _a.core, parameters = _a.parameters;
    var query = parameters[0];
    query.collection = (_b = query.collection) === null || _b === void 0 ? void 0 : _b.union(query.collection.nodes().connectedEdges());
    query.collection && query.collection.style({ 'display': 'element' });
    query.extraCollectionProperties = {
        'opacity': 1.0
    };
    return query;
};
export default declaration;
