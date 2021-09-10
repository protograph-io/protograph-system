import { ProtoGraphLoaderNamespace } from "../config";
import { AutoCompleteRulesBuilder } from "../core/AutoComplete";
import { Core } from "../core/Core";
import { ExtensionDeclaration, ExtensionDocsDecleration } from "../core/ExtensionLoader";
import { GrammarBuilder } from "../core/Parser";
import { CommandHandler } from "../core/types";


/////////////////////////// Necessary For Any Extension ///////////////////////////

// The loader creates a store of all loaded/imported extensions.
// ... This does not install/define the extension for use in a core.
// The core.defineXXXXX is used to install the extension for a core instantiation.

const docs : ExtensionDocsDecleration = {
    name: "Add",
    description: "Adds an element to the graph. Works with any [query](query) or [constructor](query_constructor).",
    category: "command",
    keywords: ["basics"],
    usage: [{
        name: "Basic",
        codeExample: "add n1"
    }, {
        name: "Paired with New Node Constructor",
        codeExample: `add 6 nodes`
    }, {
        name: "Creating Nodes with Names/Labels",
        description: "You can name the nodes whatever you like by specifying the node name while using the add command. If your name has a space in it, make sure to use quotes.",
        codeExample: `add "first node", "second node", node3`
    }, {
        name: "Paired with Edge Query",
        codeExample: `add n1 with n2`
    }, {
        name: "Paired with Constructor",
        codeExample: `add fattree`
    }]
};

// Layout extension declaration
function init(core: InstanceType<typeof Core>) {
    core.defineHandler('command', "add", add);
}
function defineGrammar(grammarBuilder : InstanceType<typeof GrammarBuilder>) {
    const expression = `"add"i sp p:query { return {keyword: "add", parameters:[p] } }`;
    grammarBuilder.defineGrammarCommand("add", "Add [Query]", expression);
}
function defineAutoComplete(autoCompleteRulesBuilder: InstanceType<typeof AutoCompleteRulesBuilder>) {
    autoCompleteRulesBuilder.defineLineStart({firstWord: "add", displayText: `add [node query / edge query]`, description: "Add new nodes or edges to your graph."})
}

// Layout extension Registration
// 1. Access Loader - 2. Create declaration Object - 3. Register Extension
declare var window : any;
let loader = window[ProtoGraphLoaderNamespace];
let declaration : ExtensionDeclaration = { name: "command_add", exec: init, grammar: defineGrammar, autocomplete: defineAutoComplete, docs };
loader.register(declaration);


////////////////////////////////////////////////////////////////////////////////




//////////////////////////// Specific Extension Logic ////////////////////////////


// Extension logic
const add: CommandHandler = ({parameters}) => {
    return parameters[0]
}

///////////////////////////////////////////////////////////////////////////////


// Extras
export default declaration;