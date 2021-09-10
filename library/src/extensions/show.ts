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
    core.defineHandler('command', "show", show);
}
function defineGrammar(grammarBuilder : InstanceType<typeof GrammarBuilder>) {
    const expression = `"show"i sp p:query { return {keyword: "show", parameters:[p] } }`;
    grammarBuilder.defineGrammarCommand("show", "Show [Query]", expression);
}
function defineAutoComplete(autoCompleteRulesBuilder: InstanceType<typeof AutoCompleteRulesBuilder>) {
    autoCompleteRulesBuilder.defineLineStart({firstWord: "show", displayText: `show [node query / edge query]`, description: "Show hidden nodes or hidden edges in your graph."})
}

// Layout extension Registration
// 1. Access Loader - 2. Create declaration Object - 3. Register Extension
declare var window : any;
let loader = window[ProtoGraphLoaderNamespace];
let declaration : ExtensionDeclaration = { name: "command_show", exec: init, grammar: defineGrammar, autocomplete: defineAutoComplete };
loader.register(declaration);


////////////////////////////////////////////////////////////////////////////////




//////////////////////////// Specific Extension Logic ////////////////////////////


// Extension logic
const show: CommandHandler = ({core, parameters}) => {
    const query : QueryResult = parameters[0] as QueryResult;
    query.collection = query.collection?.union(query.collection.nodes().connectedEdges());
    query.collection && query.collection.style({'display': 'element'});
    query.extraCollectionProperties = {
        'opacity' : 1.0
    };
    return query;
}

///////////////////////////////////////////////////////////////////////////////


// Extras
export default declaration;