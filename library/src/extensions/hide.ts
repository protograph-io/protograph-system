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
    core.defineHandler('command', "hide", hide);
}
function defineGrammar(grammarBuilder : InstanceType<typeof GrammarBuilder>) {
    const expression = `"hide"i sp p:query { return {keyword: "hide", parameters:[p] } }`;
    grammarBuilder.defineGrammarCommand("hide", "Hide [Query]", expression);
}
function defineAutoComplete(autoCompleteRulesBuilder: InstanceType<typeof AutoCompleteRulesBuilder>) {
    autoCompleteRulesBuilder.defineLineStart({firstWord: "hide", displayText: `hide [node query / edge query]`, description: "Hide nodes or edges in your graph."})
}

// Layout extension Registration
// 1. Access Loader - 2. Create declaration Object - 3. Register Extension
declare var window : any;
let loader = window[ProtoGraphLoaderNamespace];
let declaration : ExtensionDeclaration = { name: "command_hide", exec: init, grammar: defineGrammar, autocomplete: defineAutoComplete };
loader.register(declaration);


////////////////////////////////////////////////////////////////////////////////




//////////////////////////// Specific Extension Logic ////////////////////////////


// Extension logic
const hide: CommandHandler = ({core, parameters}) => {
    const query : QueryResult = parameters[0] as QueryResult;
    query.collection = query.collection?.union(query.collection.nodes().connectedEdges())
    query.extraCollectionProperties = {
        'display' : 'none',
        'opacity' : 0.0
    };
    return query;
}

///////////////////////////////////////////////////////////////////////////////


// Extras
export default declaration;