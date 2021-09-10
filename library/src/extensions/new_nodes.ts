import { ProtoGraphLoaderNamespace } from "../config";
import { Core } from "../core/Core";
import { QueryHandler } from "../core/types";
import { ExtensionDeclaration } from "../core/ExtensionLoader";
import { GrammarBuilder } from "../core/Parser";
import { IdGenerator } from "./id_generator";


/////////////////////////// Necessary For Any Extension ///////////////////////////

// The loader creates a store of all loaded/imported extensions.
// ... This does not install/define the extension for use in a core.
// The core.defineXXXXX is used to install the extension for a core instantiation.

// Layout extension declaration
function init(core: InstanceType<typeof Core>) {
    core.defineHandler('query', "new_nodes", new_nodes);
}
function defineGrammar(grammarBuilder : InstanceType<typeof GrammarBuilder>) {
    const expression = `q:number sp "nodes"i {return {type: "query", keyword:"new_nodes", parameters: [parseInt(q)]}}`;
    grammarBuilder.defineGrammarQuery("nodes", "query_new_nodes", "Query: Node: [number] Nodes", expression);
}

// Layout extension Registration
// 1. Access Loader - 2. Create declaration Object - 3. Register Extension
let loader = (window as { [key: string]: any })[ProtoGraphLoaderNamespace];
let declaration : ExtensionDeclaration = { name: "query_new_nodes", exec: init, grammar: defineGrammar };
loader.register(declaration);


////////////////////////////////////////////////////////////////////////////////




//////////////////////////// Specific Extension Logic ////////////////////////////


// Extension logic
const new_nodes: QueryHandler = ({core, parameters, namedParameters, properties, line}) => {
    const typedParameters = parameters as [number];
    const quantity: number = typedParameters[0];
    const idGenerator = core.getUtility("IdGenerator") as IdGenerator;
    const nodes = [...Array(quantity).fill(0)].map(_ => {
        const id = idGenerator.createId();
        return { group: 'nodes', data: { id, label: id, ...namedParameters }, style: {label: id} }
    });
    const eles = core.cy?.add(nodes as cytoscape.ElementDefinition[]);
    return {
        type: "query_result",
        keyword: line.keyword,
        query_object: ["nodes"],
        data: eles,
        collection: eles
    }
}

///////////////////////////////////////////////////////////////////////////////


// Extras
export default declaration;