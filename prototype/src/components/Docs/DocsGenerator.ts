import loader, { ExtensionDeclaration, ExtensionDocs, ExtensionDocsDecleration } from "protograph/lib/core/ExtensionLoader";

const stepDocs : (ExtensionDocs & {id: ExtensionDeclaration["name"]}) = {
    id: "internal:step",
    name: "Step",
    description: "Used to add a new frame to an animation. The commands before the 'step' dictate the previous frame and the commands after the 'step' dictate the next frame. The 'step' acts as the divider between frames, thus an animation with one 'step' command has two frames. Without a 'step' command, a visualization has one frame. The code before the first 'step' command dictates the creates first frame.",
    category: "command",
    keywords: ["basics"],
    usage: [{
        name: "Basic Background Animation (2 Frames)",
        codeExample: `layout\n\tname: cose\n\nadd 3 nodes\n\tbackground: red\n\n\tstep\n\nall nodes\n\tbackground: blue`
    }, {
        name: "Creating a Binary Tree in Multiple Frames (3 Frames)",
        codeExample: `layout \n\tname: breadthfirst \n\na\n\nstep\n\na -> b1,b2\n\nstep\n\nb1 -> c1,c2\nb2 -> c3,c4`
    },
    {
        name: "Connect a Layered Network Over Multiple Frames (4 Frames)",
        codeExample: `layout \n\tname: preset\n\n1 nodes \n\tlayer: 1\n\n3 nodes\n\tlayer: 2\n\t\n3 nodes\n\tlayer: 3\n\n1 nodes\n\tlayer: 4\n\nall nodes\n\tbackground-color: black\n\t\narrangemlp \n\nstep\n\nconnect (select nodes where layer is 1) -> (select nodes where layer is 2)\n\tlabel: ""\n\nstep\n\nconnect (select nodes where layer is 2) -> (select nodes where layer is 3)\n\tlabel: ""\n\nstep\n\nconnect (select nodes where layer is 3) -> (select nodes where layer is 4)\n\tlabel: ""`
    }
]
};


export class DocsGenerator {
    extensionDocs : (ExtensionDocs & {id: ExtensionDeclaration["name"]})[] = [stepDocs];
    availableExtensionIds = new Set();
    constructor(includeWindowExtensions: null | string[] = null) {
        // if includeWindowExtensions === null, then load all otherwise pass array
        let extensionsToLoad = Array.from(loader.entries());
        if (Array.isArray(includeWindowExtensions)) {
            // Use includeWindowExtensions to filter window set extensions
            extensionsToLoad = extensionsToLoad.filter(([name, f]) => includeWindowExtensions.includes(name));
        }
        for (let [, extensionExec] of extensionsToLoad) {
            // Pass extension core
            extensionExec.docs && this.extensionDocs.push({
                id: extensionExec.name,
                ...extensionExec.docs
            });
            this.availableExtensionIds.add(extensionExec.name)
        }
    }
    areDependenciesMet(dependencies : ExtensionDeclaration["name"][]) : boolean {
        return dependencies.every(dep => this.availableExtensionIds.has(dep));
    }
    generate() {
        
    }
}