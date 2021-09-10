import { NodeCollection } from "cytoscape";
import { ProtoGraphLoaderNamespace } from "../config";
import { AutoCompleteRulesBuilder } from "../core/AutoComplete";
import { Core } from "../core/Core";
import { ExtensionDeclaration } from "../core/ExtensionLoader";
import { GrammarBuilder } from "../core/Parser";
import { CommandHandler } from "../core/types";


/////////////////////////// Necessary For Any Extension ///////////////////////////

// The loader creates a store of all loaded/imported extensions.
// ... This does not install/define the extension for use in a core.
// The core.defineXXXXX is used to install the extension for a core instantiation.

// Layout extension declaration
function init(core: InstanceType<typeof Core>) {
    core.defineHandler('command', "arrangemlp", arrangemlp);
}
function defineGrammar(grammarBuilder : InstanceType<typeof GrammarBuilder>) {
    const expression = `"arrangemlp"i { return {keyword: "arrangemlp", parameters:[] } }`;
    grammarBuilder.defineGrammarCommand("arrangemlp", "Arrangemlp", expression);
}
function defineAutoComplete(autoCompleteRulesBuilder: InstanceType<typeof AutoCompleteRulesBuilder>) {
    autoCompleteRulesBuilder.defineLineStart({firstWord: "arrangemlp", displayText: `arrangemlp`, description: "Arrange a Multi-Layer Perceptron"})
}

// Layout extension Registration
// 1. Access Loader - 2. Create declaration Object - 3. Register Extension
declare var window : any;
let loader = window[ProtoGraphLoaderNamespace];
let declaration : ExtensionDeclaration = { name: "command_arrangemlp", exec: init, grammar: defineGrammar, autocomplete: defineAutoComplete };
loader.register(declaration);


////////////////////////////////////////////////////////////////////////////////




//////////////////////////// Specific Extension Logic ////////////////////////////


// Extension logic
const arrangemlp: CommandHandler = ({core, parameters}) => {
    var nodeCollection = core.cy?.elements().nodes();
    if(nodeCollection === undefined || nodeCollection.size() === 0) { return; }
    const px = 100;
    
    var layers = nodeCollection.map(node => Number(node.attr('layer'))).filter(v => !Number.isNaN(v));
    var total_layers = Math.max(...layers);
    var layerDict: Record<number, NodeCollection> = {}

    for(let i = 1 ; i <= total_layers; i++)
    {
        layerDict[i] = nodeCollection.filter(node => Number(node.attr('layer')) === i);
    }
    var max_nodes = 0;
    for(let key in layerDict){
        var numNodes = layerDict[key].size();
        max_nodes = numNodes > max_nodes ? numNodes : max_nodes;
    }
    var max_center_pixels = (max_nodes - 1)*px / 2;
    for(let key in layerDict) {
        let nc = layerDict[key];
        let center_pixels = (nc.size() - 1) * px / 2;
        let offset = max_center_pixels - center_pixels;
        nc.positions(function(node, i){
            return {
                x: px * Number(key),
                y: (i * px) + offset
            }
        });
    }
}

///////////////////////////////////////////////////////////////////////////////


// Extras
export default declaration;