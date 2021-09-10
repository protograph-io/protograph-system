import { ProtoGraphLoaderNamespace } from "../config";
function init(core) {
    core.defineHandler('command', "remove", remove);
}
function defineGrammar(grammarBuilder) {
    var expression = "\"remove\"i sp p:query { return {keyword: \"remove\", parameters:[p] } }";
    grammarBuilder.defineGrammarCommand("remove", "Remove [Query]", expression);
}
function defineAutoComplete(autoCompleteRulesBuilder) {
    autoCompleteRulesBuilder.defineLineStart({ firstWord: "remove", displayText: "remove [node query / edge query]", description: "Remove nodes or edges to your graph." });
}
var loader = window[ProtoGraphLoaderNamespace];
var declaration = { name: "command_remove", exec: init, grammar: defineGrammar, autocomplete: defineAutoComplete };
loader.register(declaration);
var remove = function (_a) {
    var _b;
    var core = _a.core, parameters = _a.parameters;
    var query = parameters[0];
    query.collection && ((_b = core.cy) === null || _b === void 0 ? void 0 : _b.remove(query.collection));
};
export default declaration;
