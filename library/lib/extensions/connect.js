import { ProtoGraphLoaderNamespace } from "../config";
var docs = {
    name: "Connect",
    description: "Used to created edges by connecting nodes. Accepts any query. Alias for [Add](command/command_add).",
    category: "command",
    keywords: ["basics"],
    usage: [{
            name: "Basic",
            description: "See [edge query](query/query_edge) for more info.",
            dependencies: ["query_edge"],
            codeExample: "connect n1 with n2"
        }]
};
function init(core) {
    core.defineHandler('command', "connect", connect);
}
function defineGrammar(grammarBuilder) {
    var expression = "\"connect\"i  sp p:query { return {keyword: \"connect\", parameters:[p] } }";
    grammarBuilder.defineGrammarCommand("connect", "Connect [Query]", expression);
}
function defineAutoComplete(autoCompleteRulesBuilder) {
    autoCompleteRulesBuilder.defineLineStart({ firstWord: "connect", displayText: "connect [node query] [edge type] [node query]", description: "Create new edges." });
}
var loader = window[ProtoGraphLoaderNamespace];
var declaration = { name: "command_connect", exec: init, grammar: defineGrammar, autocomplete: defineAutoComplete, docs: docs };
loader.register(declaration);
var connect = function (_a) {
    var parameters = _a.parameters;
    return parameters[0];
};
export default declaration;
