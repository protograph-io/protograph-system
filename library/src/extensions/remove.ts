import { ProtoGraphLoaderNamespace } from "../config";
import { AutoCompleteRulesBuilder } from "../core/AutoComplete";
import { Core } from "../core/Core";
import { ExtensionDeclaration } from "../core/ExtensionLoader";
import { GrammarBuilder } from "../core/Parser";
import { CommandHandler, QueryResult } from "../core/types";


/////////////////////////// Necessary For Any Extension ///////////////////////////

// The loader creates a store of all loaded/imported extensions.
// ... This does not install/define the extension for use in a core.
// The core.defineXXXXX is used to install the extension for a core instantiation.

// Layout extension declaration
function init(core: InstanceType<typeof Core>) {
    core.defineHandler('command', "remove", remove);
}
function defineGrammar(grammarBuilder : InstanceType<typeof GrammarBuilder>) {
    const expression = `"remove"i sp p:query { return {keyword: "remove", parameters:[p] } }`;
    grammarBuilder.defineGrammarCommand("remove", "Remove [Query]", expression);
}
function defineAutoComplete(autoCompleteRulesBuilder: InstanceType<typeof AutoCompleteRulesBuilder>) {
    autoCompleteRulesBuilder.defineLineStart({firstWord: "remove", displayText: `remove [node query / edge query]`, description: "Remove nodes or edges to your graph."})
}

// Layout extension Registration
// 1. Access Loader - 2. Create declaration Object - 3. Register Extension
declare var window : any;
let loader = window[ProtoGraphLoaderNamespace];
let declaration : ExtensionDeclaration = { name: "command_remove", exec: init, grammar: defineGrammar, autocomplete: defineAutoComplete };
loader.register(declaration);


////////////////////////////////////////////////////////////////////////////////




//////////////////////////// Specific Extension Logic ////////////////////////////


// Extension logic
const remove: CommandHandler = ({core, parameters}) => {
    const query : QueryResult = parameters[0] as QueryResult;
    query.collection && core.cy?.remove(query.collection)
}

///////////////////////////////////////////////////////////////////////////////


// Extras
export default declaration;