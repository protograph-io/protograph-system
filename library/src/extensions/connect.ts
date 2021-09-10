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

const docs: ExtensionDocsDecleration = {
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

// Layout extension declaration
function init(core: InstanceType<typeof Core>) {
    core.defineHandler('command', "connect", connect);
}
function defineGrammar(grammarBuilder : InstanceType<typeof GrammarBuilder>) {
    const expression = `"connect"i  sp p:query { return {keyword: "connect", parameters:[p] } }`;
    grammarBuilder.defineGrammarCommand("connect", "Connect [Query]", expression);
}
function defineAutoComplete(autoCompleteRulesBuilder: InstanceType<typeof AutoCompleteRulesBuilder>) {
    autoCompleteRulesBuilder.defineLineStart({firstWord: "connect", displayText: `connect [node query] [edge type] [node query]`, description: "Create new edges."})
}

// Layout extension Registration
// 1. Access Loader - 2. Create declaration Object - 3. Register Extension
let loader = (window as { [key: string]: any })[ProtoGraphLoaderNamespace];
let declaration : ExtensionDeclaration = { name: "command_connect", exec: init, grammar: defineGrammar, autocomplete: defineAutoComplete, docs };
loader.register(declaration);


////////////////////////////////////////////////////////////////////////////////




//////////////////////////// Specific Extension Logic ////////////////////////////


// Extension logic
const connect: CommandHandler = ({parameters}) => {
    return parameters[0]
}

///////////////////////////////////////////////////////////////////////////////


// Extras
export default declaration;