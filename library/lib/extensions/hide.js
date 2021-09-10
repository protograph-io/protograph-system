import { ProtoGraphLoaderNamespace } from "../config";
function init(core) {
    core.defineHandler('command', "hide", hide);
}
function defineGrammar(grammarBuilder) {
    var expression = "\"hide\"i sp p:query { return {keyword: \"hide\", parameters:[p] } }";
    grammarBuilder.defineGrammarCommand("hide", "Hide [Query]", expression);
}
function defineAutoComplete(autoCompleteRulesBuilder) {
    autoCompleteRulesBuilder.defineLineStart({ firstWord: "hide", displayText: "hide [node query / edge query]", description: "Hide nodes or edges in your graph." });
}
var loader = window[ProtoGraphLoaderNamespace];
var declaration = { name: "command_hide", exec: init, grammar: defineGrammar, autocomplete: defineAutoComplete };
loader.register(declaration);
var hide = function (_a) {
    var _b;
    var core = _a.core, parameters = _a.parameters;
    var query = parameters[0];
    query.collection = (_b = query.collection) === null || _b === void 0 ? void 0 : _b.union(query.collection.nodes().connectedEdges());
    query.extraCollectionProperties = {
        'display': 'none',
        'opacity': 0.0
    };
    return query;
};
export default declaration;
