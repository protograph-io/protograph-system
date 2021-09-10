import { ProtoGraphLoaderNamespace } from "../config";
import { Core } from "../core/Core";
import { QueryHandler } from "../core/types";
import { ExtensionDeclaration, ExtensionDocsDecleration } from "../core/ExtensionLoader";
import { GrammarBuilder } from "../core/Parser";


/////////////////////////// Necessary For Any Extension ///////////////////////////

// The loader creates a store of all loaded/imported extensions.
// ... This does not install/define the extension for use in a core.
// The core.defineXXXXX is used to install the extension for a core instantiation.


const docs: ExtensionDocsDecleration = {
    name: "All Edges",
    description: "Selects all edges.",
    category: "query",
    keywords: ["basics"],
    usage: [{
        name: "Basic",
        codeExample: "all edges"
    }, {
        name: "Basic with Properties",
        codeExample: `add edges
    line-color: red`
    }]
};


// Layout extension declaration
function init(core: InstanceType<typeof Core>): void {
    core.defineHandler('query', "all_edges", all_edges);
}
function defineGrammar(grammarBuilder: InstanceType<typeof GrammarBuilder>): void {
    const expression = `"all edges"i {return {type: "query", keyword:"all_edges", parameters: []}}`;
    grammarBuilder.defineGrammarQuery("edges", "query_all_edges", "Query: Edge: All Edges", expression);
}


// Layout extension Registration
// 1. Access Loader - 2. Create declaration Object - 3. Register Extension
const loader = (window as { [key: string]: any })[ProtoGraphLoaderNamespace];
const declaration: ExtensionDeclaration = { name: "query_all_edges", exec: init, grammar: defineGrammar, docs };
loader.register(declaration);


////////////////////////////////////////////////////////////////////////////////




//////////////////////////// Specific Extension Logic ////////////////////////////


// Extension logic
const all_edges: QueryHandler = ({ core, line }) => {
    const data = core.cy?.elements('edge');
    return {
        type: "query_result",
        keyword: line.keyword,
        query_object: ["edges"],
        data,
        collection: data
    }
}

///////////////////////////////////////////////////////////////////////////////


// Extras
export default declaration;