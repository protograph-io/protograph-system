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
    core.defineHandler('command', "path", path);
    core.defineHandler('query', "path", path);
}
function defineGrammar(grammarBuilder: InstanceType<typeof GrammarBuilder>) {
    // Prefer query over command
    const expression = `"path"i sp p:query_object_nodes sp "to"i sp q:query_object_nodes { return {keyword: "path", parameters:[p, q] } }`;
    grammarBuilder.defineGrammarCommand("path", "Path [Query] to [Query]", expression);
    const expressionQuery = `"path"i sp p:query_object_nodes sp "to"i sp q:query_object_nodes { return {type: "query", keyword: "path", parameters:[p, q] } }`;
    grammarBuilder.defineGrammarQuery("edges", "sql_select_query_edges", "Path [Query] to [Query]", expressionQuery);
}
function defineAutoComplete(autoCompleteRulesBuilder: InstanceType<typeof AutoCompleteRulesBuilder>) {
    autoCompleteRulesBuilder.defineLineStart({ firstWord: "path", displayText: `path [node query]`, description: "Get path between two nodes" })
}

// Layout extension Registration
// 1. Access Loader - 2. Create declaration Object - 3. Register Extension
declare var window: any;
let loader = window[ProtoGraphLoaderNamespace];
let declaration: ExtensionDeclaration = { name: "command_path", exec: init, grammar: defineGrammar, autocomplete: defineAutoComplete };
loader.register(declaration);


////////////////////////////////////////////////////////////////////////////////




//////////////////////////// Specific Extension Logic ////////////////////////////


// Extension logic
const path: CommandHandler = ({ core, parameters }) => {
    if (!core.cy) throw Error("Cytoscape not initialized")
    const query1: QueryResult = parameters[0] as QueryResult;
    const query2: QueryResult = parameters[1] as QueryResult;
    console.log(parameters);
    // Non empty query collection
    if (query1.collection == null || query2.collection == null) {
        console.log("CALLING PATH QUIT 1", parameters)
        return {
            type: "query_result",
            keyword: "path",
            query_object: ["edges"],
            data: core.cy.collection(),
            collection: core.cy.collection()
        }
    }
    var nodeCollection1 = query1.collection.nodes();
    var nodeCollection2 = query2.collection.nodes();
    if (nodeCollection1.size() < 1 || nodeCollection2.size() < 1) {
        console.log("CALLING PATH QUIT 2", parameters)
        return {
            type: "query_result",
            keyword: "path",
            query_object: ["edges"],
            data: core.cy.collection(),
            collection: core.cy.collection()
        }
    }
    var startElement = nodeCollection1[0];
    var endElement = nodeCollection2[0];
    var fw = core.cy?.elements().floydWarshall({
        weight: function (edge) {
            return 1;
        }
    });
    var data = fw?.path(startElement, endElement).filter(ele => ele.isEdge());
    console.log(data);
    console.log("CALLING PATH", parameters, data)
    return {
        type: "query_result",
        keyword: "path",
        query_object: ["edges"],
        data,
        collection: data
    }
}

///////////////////////////////////////////////////////////////////////////////


// Extras
export default declaration;