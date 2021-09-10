import { ProtoGraphLoaderNamespace } from "../config";
import { Core } from "../core/Core";
import { QueryHandler } from "../core/types";
import { ExtensionDeclaration } from "../core/ExtensionLoader";
import { GrammarBuilder } from "../core/Parser";


/////////////////////////// Necessary For Any Extension ///////////////////////////

// The loader creates a store of all loaded/imported extensions.
// ... This does not install/define the extension for use in a core.
// The core.defineXXXXX is used to install the extension for a core instantiation.

// Layout extension declaration
function init(core: InstanceType<typeof Core>) {
    core.defineHandler('query', "node", node);
}
function defineGrammar(grammarBuilder : InstanceType<typeof GrammarBuilder>) {
    const expression = `p:(anyword) {return {type: "query", keyword: "node", parameters:[p]}}`;
    grammarBuilder.defineGrammarQuery("nodes_id", "node_by_id", "Query: Node: Node Id", expression);
    grammarBuilder.defineGrammarQuery("nodes", "node_by_id", "Query: Node: Node Id", expression);
}

// Layout extension Registration
// 1. Access Loader - 2. Create declaration Object - 3. Register Extension
let loader = (window as { [key: string]: any })[ProtoGraphLoaderNamespace];
let declaration : ExtensionDeclaration = { name: "query_node", exec: init, grammar: defineGrammar };
loader.register(declaration);


////////////////////////////////////////////////////////////////////////////////




//////////////////////////// Specific Extension Logic ////////////////////////////


// Extension logic
export const node: QueryHandler = ({core, parameters, namedParameters, properties, line}) => {
    // log("query: node ", "status: start", properties);
    if (!core.cy) throw Error("Core Cytoscape not initialized");
    const cy = core.cy;

    const id = (parameters as string[])[0];
    // Unoptimized: could get all at once and then add what is needed in one step
    let node = cy.$(`#${id}`);
    if (node?.empty()) {
        // log("query: node ", "status: run", "info: adding", id);
        node = cy.add({ group: 'nodes', data: { id: id, label: id }, style: {label: id} });
    }
    // The last step merges the collections
    // log("query: node ", "status: end", node);
    return {
        type: "query_result",
        keyword: line.keyword,
        query_object: ["nodes"],
        data: node,
        collection: node
    }
}

///////////////////////////////////////////////////////////////////////////////


// Extras
export default declaration;