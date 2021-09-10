import { ProtoGraphLoaderNamespace } from "../config";
import { Core } from "../core/Core";
import { QueryHandler } from "../core/types";
import { ExtensionDeclaration, ExtensionDocsDecleration } from "../core/ExtensionLoader";
import { isObjAndHas } from "../core/helpers";
import { GrammarBuilder } from "../core/Parser";
import { BaseQueries } from "../core/types";


const docs: ExtensionDocsDecleration = {
    name: "Selecting Multiple Nodes/Edges",
    description: "You can select multiple nodes or edges by listing their ids in a comma seperated list.",
    category: "query",
    keywords: ["basics"],
    usage: [{
        name: "Multiple Nodes",
        codeExample: "n1,n2,n5\n\tbackground-color: red"
    }, {
        name: "Multiple Edges",
        codeExample: `e1,e2,e5\n\tbackground-color: red`
    }]
};



// Extension logic
function init(core: InstanceType<typeof Core>) {
    const union: QueryHandler = ({ core, parameters, namedParameters, properties, line }) => {
        // log("query: union ", "status: start", parameters, namedParameters, properties);
        if (!parameters.every(p => isObjAndHas(p, "data"))) throw Error("Unsupported parameters");
        if (!parameters.every(p => isObjAndHas(p, "query_object"))) throw Error("Unsupported parameters");
        const pars = parameters as BaseQueries.Result[];
        const data = pars
            .map(p => p.data)
            .reduce((agg, item) => agg.union(item));
        const objects: string[] = pars
            .map(p => p.query_object)
            .reduce((agg, item) => [...agg, ...item], []);
        // The last step merges the collections
        // log("query: union ", "status: end", data);
        return {
            type: "query_result",
            keyword: line.keyword,
            query_object: [...Array.from(new Set(objects))],
            data: data,
            collection: data
        }
    }
    core.defineHandler('query', "union", union);
}
function defineGrammar(grammarBuilder: InstanceType<typeof GrammarBuilder>) {
    const expression = `ns:(n1: query_object_nodes_id sp? "," sp? {return n1})* n2:query_object_nodes_id 
	{return {type: "query", keyword: "union", parameters: [...ns, n2]}}`;
    grammarBuilder.defineGrammarQuery("nodes", "query_union", "Query: Node: Node Id, Node Id, ...", expression);
}

let loader = (window as { [key: string]: any })[ProtoGraphLoaderNamespace];
let declaration: ExtensionDeclaration = { name: "query_union", exec: init, grammar: defineGrammar, docs };
loader.register(declaration);

export default declaration;