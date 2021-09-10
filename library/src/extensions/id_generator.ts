import { ProtoGraphLoaderNamespace } from "../config";
import { Core } from "../core/Core";
import { ExtensionDeclaration } from "../core/ExtensionLoader";
import { Utility } from "../core/types";

//////////////////////////// Specific Extension Logic ////////////////////////////


// Extension logic

export class IdGenerator implements Utility {
    private incrementer = 1;
    public createId(prefix = "n") {
        const id = prefix + this.incrementer;
        this.incrementer++;
        return id;
    }
    public reset() {
        this.incrementer = 1;
    }
}



///////////////////////////////////////////////////////////////////////////////



/////////////////////////// Necessary For Any Extension ///////////////////////////

// The loader creates a store of all loaded/imported extensions.
// ... This does not install/define the extension for use in a core.
// The core.defineXXXXX is used to install the extension for a core instantiation.

// Layout extension declaration
function init(core: InstanceType<typeof Core>) {
    core.defineUtility("IdGenerator", new IdGenerator());
}

// Layout extension Registration
// 1. Access Loader - 2. Create declaration Object - 3. Register Extension
let loader = (window as { [key: string]: any })[ProtoGraphLoaderNamespace];
let declaration: ExtensionDeclaration = { name: "utility_id_generator", exec: init };
loader.register(declaration);


////////////////////////////////////////////////////////////////////////////////


// Extras
export default declaration;