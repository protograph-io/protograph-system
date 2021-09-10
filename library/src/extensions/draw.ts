import { ProtoGraphLoaderNamespace } from "../config";
import { AutoCompleteRulesBuilder } from "../core/AutoComplete";
import { Core } from "../core/Core";
import { ExtensionDeclaration, ExtensionDocsDecleration } from "../core/ExtensionLoader";
import { GrammarBuilder } from "../core/Parser";
import { CommandHandler, QueryResult } from "../core/types";

// TODO: accept parameter to change percentage in case edge is long and 900% is not big enough

/////////////////////////// Necessary For Any Extension ///////////////////////////

// The loader creates a store of all loaded/imported extensions.
// ... This does not install/define the extension for use in a core.
// The core.defineXXXXX is used to install the extension for a core instantiation.

const example = `a1 -> a2 <- a3

draw start a1 -> a2

step

draw end a1 -> a2`;

const exampleRetract = `a1 -> a2 <- a3

draw end a1 -> a2

step

draw start a1 -> a2`;

const docs: ExtensionDocsDecleration = {
    name: "Draw",
    description: `A command to make it easier to animate the drawing of an edge from one node to another. Set \`start\` when you want to hide the edge and \`end\` when you want to draw the edge. Reverse \`end\` and \`start\` to show the edge retracting. \n\n ### Details\nApplies 'target-distance-from-node': "900%" and 'source-distance-from-node': '0%' to hide the edge and 'target-distance-from-node': '0%' and 'source-distance-from-node': '0%' to animate drawing the edge.`,
    category: "command",
    keywords: ["basics"],
    usage: [{
        name: "Basic",
        dependencies: ["query_edge"],
        codeExample: example
    },
    {
        name: "Retract Edge",
        dependencies: ["query_edge"],
        codeExample: exampleRetract
    }]
};

// Layout extension declaration
function init(core: InstanceType<typeof Core>) {
    core.defineHandler('command', "draw", draw);
}
function defineGrammar(grammarBuilder: InstanceType<typeof GrammarBuilder>) {
    const expression = `"draw"i sp+ seq:("start"i/"end"i) sp+ p:query_object_edges { return {keyword: "draw", parameters:[seq,p] } }`;
    grammarBuilder.defineGrammarCommand("draw", "Path [Edge Query]", expression);
}
function defineAutoComplete(autoCompleteRulesBuilder: InstanceType<typeof AutoCompleteRulesBuilder>) {
    autoCompleteRulesBuilder.defineLineStart({ firstWord: "draw", displayText: `draw [edge query]`, description: "Animates an edge from its source to sink" })
}

// Layout extension Registration
// 1. Access Loader - 2. Create declaration Object - 3. Register Extension
declare var window: any;
let loader = window[ProtoGraphLoaderNamespace];
let declaration: ExtensionDeclaration = { name: "command_draw", exec: init, grammar: defineGrammar, autocomplete: defineAutoComplete, docs };
loader.register(declaration);


////////////////////////////////////////////////////////////////////////////////


//////////////////////////// Specific Extension Logic ////////////////////////////

// Extension logic
const draw: CommandHandler = ({ core, parameters }) => {
    console.log("DRAW", parameters);
    const seq: "start" | "end" = parameters[0].toString().toLowerCase() as any;
    const query1: QueryResult = parameters[1] as QueryResult;
    const edges = query1.collection?.filter("edge") || core.cy?.collection();
    return {
        ...query1,
        collection: edges,
        data: edges,
        extraCollectionProperties: (
            (seq === "start") ?
                {
                    'target-distance-from-node': "900%",
                    'source-distance-from-node': '0%'
                } : {
                    'target-distance-from-node': '0%',
                    'source-distance-from-node': '0%'
                }
        )
    };
}

///////////////////////////////////////////////////////////////////////////////


// Extras
export default declaration;




//////////////////////////// Two Options ////////////////////////////

// Unsafe bc target distance is a heuristic

// (seq === "start") ?
//                 {
//                     'target-distance-from-node': "500%",
//                     'source-distance-from-node': '0%'
//                 } : {
//                     'target-distance-from-node': '0%'
//                 }


// Not much better and does not work in reverse

// (seq === "start") ?
//                 {
//                     "line-style": "dashed",
//                     "line-dash-pattern": "500%",
//                     "line-dash-offset": "500%",
//                     "arrow-scale": 0.01
//                 } : {
//                     "line-dash-offset": "0%",
//                     "arrow-scale": 1
//                 }


// a1 -> a2 <- a3

// a1 -> a2
//     'target-distance-from-node': '1000%'
//     'source-distance-from-node': '0%'

// a3 -> a2
//     line-style: dashed
//     line-dash-pattern: "400%"
//     line-dash-offset: "400%"

// step

// a1 -> a2
//     'target-distance-from-node': '0%'

// a3 -> a2
//     line-dash-offset: "0%"




