import { ProtoGraphLoaderNamespace } from "../config";
var docs = {
    name: "Add",
    description: "Adds an element to the graph. Works with any [query](query) or [constructor](query_constructor).",
    category: "command",
    keywords: ["basics"],
    usage: [{
            name: "Basic",
            codeExample: "add n1"
        }, {
            name: "Paired with New Node Constructor",
            codeExample: "add 6 nodes"
        }, {
            name: "Creating Nodes with Names/Labels",
            description: "You can name the nodes whatever you like by specifying the node name while using the add command. If your name has a space in it, make sure to use quotes.",
            codeExample: "add \"first node\", \"second node\", node3"
        }, {
            name: "Paired with Edge Query",
            codeExample: "add n1 with n2"
        }, {
            name: "Paired with Constructor",
            codeExample: "add fattree"
        }]
};
function init(core) {
    core.defineHandler('command', "add", add);
}
function defineGrammar(grammarBuilder) {
    var expression = "\"add\"i sp p:query { return {keyword: \"add\", parameters:[p] } }";
    grammarBuilder.defineGrammarCommand("add", "Add [Query]", expression);
}
function defineAutoComplete(autoCompleteRulesBuilder) {
    autoCompleteRulesBuilder.defineLineStart({ firstWord: "add", displayText: "add [node query / edge query]", description: "Add new nodes or edges to your graph." });
}
var loader = window[ProtoGraphLoaderNamespace];
var declaration = { name: "command_add", exec: init, grammar: defineGrammar, autocomplete: defineAutoComplete, docs: docs };
loader.register(declaration);
var add = function (_a) {
    var parameters = _a.parameters;
    return parameters[0];
};
export default declaration;
