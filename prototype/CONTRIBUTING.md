# ProtoGraph (Extension Guide)

**This page is best viewed from the [Wiki](../../../wiki)**

ProtoGraph is an extensible graph (node-link) visualization and animation system.

This repo showcases the ProtoGraph System implemented in JavaScript with PEG.js, CodeMirror, and Cystoscape.

See the [README](../blob/main/prototype/README.md)) for more information for how ProtoGraph works.

## Understanding The Behind the Scenes (Optional)

***TLDR:** skip this section.*

The extension system is designed to allow extensions to be imported by just including a single script tag. 

At the same time, the ProtoGraph system is designed to allow multiple instances of any component (see [README](../blob/main/prototype/README.md) for more insight).

Thus the extension system stores each extension into a ProtoGraph window variable/object. When any component of ProtoGraph instantiates it loads the plugins from the window object. Each component then executes the extension property that corresponds to what they need, allowing components to work closer to isolation. This is why defining an extension involves calling a window object and registering a function declaration with multiple functions as properties.

## What are Extensions?

An extension extends the functionality of the ProtoGraph system. This could be a new:
-  action (called a **command** - e.g. `align`)
-  property of the graph or a meta system (called an **object** - e.g. `layout`)
-  query system or graph constructor (called a **query** - e.g. SQL)
-  graph element type (called object class or **query object** - e.g. compound nodes)
-  utility for other extension developers (called a **utility**).

## Designing Your Extension

Before designing an extension it is important to understand the [ProtoGraph Language](README.md#protograph-language).

To design an extension for this implementation of ProtoGraph an extension should define as many of the following as applicable:
- Grammar Fragment (`grammar` property): this is used by the Parser to include the extension's grammar in the ProtoGraph grammar. It is used to parse a code segment and pass it to the correct handler. *(Not applicable for Utilities)*
- Interpreter Handler (`exec` property): when the Parser recognizes your grammar fragment, a JSON object is passed to the interpreter which looks for your handler and passes the object (with the parameters already evaluated) to your handler. *(Not applicable for Utilities)*
  - Dynamic Autocomplete: the interpreter allows a handler to return function that returns a list of autocomplete possibilities for properties. This is heavily recommended for Objects. Commands and queries should include this if they allow new properties (see warnings in [ProtoGraph Language](../blob/main/prototype/README.md#protograph-language)). *(Not applicable for Utilities)*
- New Line Autocomplete (`autocomplete` property): this is loaded by the CodeMirror instance and constructs the static autocomplete set for new lines. *(Not applicable for Queries and Utilities)*

```ts
// import { ProtoGraphLoaderNamespace } from "../config"; 
const ProtoGraphLoaderNamespace = "protograph_loader"

declare var window : any;
let loader = window[ProtoGraphLoaderNamespace];

let declaration : ExtensionDeclaration = { 
    name: "command_add", 
    exec: init, 
    grammar: defineGrammar, 
    autocomplete: defineAutoComplete 
};

loader.register(declaration);
```

## Developing Your Extension

Everything in ProtoGraph, except the `step` keyword, is an extension. Core extensions can provide useful insight into developing extensions. They may also provide a good starting point for your extensions. These core extensions can be found in [`src/extensions/`](../tree/main/prototype/src/extensions).

### Grammar (PEG.js)

The core to almost every extension is its grammar. This ProtoGraph implementation uses [PEG.js](https://pegjs.org/) as its parser generator. Therefore, it is recommended to learn about the [PEG.js grammar syntax](https://pegjs.org/documentation).

Once you are ready, you can use the [PEG.js Online Tool](https://pegjs.org/online) to develop and test your grammar. When you are done you can define the your grammar fragment as the part of your grammar rule after the equal sign (ProtoGraph's Grammar Builder creates the rule name to ensure no rule name clashes).

Defining a grammar fragment is done by passing a function to the `grammar` property of your [Extension Declaration](wiki/../wiki/Interface:%20ExtensionDeclaration). The function you define will receive an instance of [GrammarBuilder](wiki/../wiki/Class:%20GrammarBuilder).

A grammar fragment must return a specific object ([type Line](wiki/../wiki/Module:%20Grammar#line)) so that the interpreter can route it.

#### Example ([Add Command Extension](../tree/main/prototype/src/extensions/add.ts))
```ts
function defineGrammar(grammarBuilder : InstanceType<typeof GrammarBuilder>) {
    const expression = `"add"i sp p:query { return {keyword: "add", parameters:[p] } }`;
    grammarBuilder.defineGrammarCommand("add", "Add [Query]", expression);
}
```

If you need secondary rules to better organize your extension's rule, you can use define dedicated grammar fragments. The GrammarBuilder does not generate rule names for grammar fragments, so fragments can be used by different extensions, but this can lead to name clashes so it is advisable to prefix your rules with a more unique name (like your extension keyword).

#### Safe Example (prevents name clashes) ([Connect Command Extension](../tree/main/prototype/src/extensions/connect.ts)):
```ts
function defineGrammar(grammarBuilder : InstanceType<typeof GrammarBuilder>) {
    // SAFE - Prevents name clashes
    const {name: safeName, declaration: safeFragment} = grammarBuilder.constructRuleDefinition({
        keyword: "edge_type", 
        humanReadableName: "Edge Query Edge Type", 
        expression: `"to"i / "with"i / "<-" / "->" / "-" / "from"i`, 
        includeUniquePrefix = true // optional (default: true)
    });
    grammarBuilder.defineGrammarFragment(safeFragment);

    const expression = `
    left:(
		l:query_object_nodes sp* t:${safeName} sp * {return [l,t]}
    ) + right:(query_object_nodes) {return {type: "query", keyword: "edge", parameters:[...left,right].flat()}}
    `;
    grammarBuilder.defineGrammarQuery("edges", "query_edge", "Query: Edge: [Node] [Type] [Node]", expression);
}
```

#### Unsafe Example (allows any developer to use `edge_type` but may have rule name clashes) ([Connect Command Extension](../tree/main/prototype/src/extensions/connect.ts)):
```ts
function defineGrammar(grammarBuilder : InstanceType<typeof GrammarBuilder>) {
    // UNSAFE - Watch out for rule name clashes
    grammarBuilder.defineGrammarFragment(`query_edge_type = "to"i / "with"i / "<-" / "->" / "-" / "from"i`);
    
    const expression = `
    left:(
		l:query_object_nodes sp* t:query_edge_type sp * {return [l,t]}
    ) + right:(query_object_nodes) {return {type: "query", keyword: "edge", parameters:[...left,right].flat()}}
    `;
    grammarBuilder.defineGrammarQuery("edges", "query_edge", "Query: Edge: [Node] [Type] [Node]", expression);
}
```

### Interpreter Handler

The interpreter handler is where your extension actually interacts with the Cytoscape instance and the graph can be modified. 

Defining a handler is done by passing a function to the `exec` property of your [Extension Declaration](wiki/../wiki/Interface:%20ExtensionDeclaration). The function you define will receive an instance of [Core](wiki/../wiki/Class:%20Core).

Pay close attention to the documentation of what [type/object](wiki/../wiki/Module:%20types#commandhandler) you are supposed to return, which in many cases is a [QueryResult](wiki/../wiki/Interface:%20QueryResult).

Make sure that you return a meaningful Cytoscape collection as the `collection` property of your returned object, unless you purposefully mean to do otherwise. In most cases this is the union of any queries that are parameters or the set of created/selected elements. The interpreter automatically applies properties (as defined in the [ProtoGraph Language](../blob/main/prototype/README.md#protograph-language)) to the returned collection. Users expect this behavior to not be interrupted unless that is part of your intended functionality.

#### Example ([Node Id Query Extension](../tree/main/prototype/src/extensions/node.ts)):

```ts
function init(core: InstanceType<typeof Core>) {
    core.defineHandler('query', "node", node);
}

// Extension logic
export const node: QueryHandler = ({core, parameters, namedParameters, properties, line}) => {
    // Should never occur but still worth checking
    if (!core.cy) throw Error("Core Cytoscape not initialized");
    const cy = core.cy;

    const id = (parameters as string[])[0];

    let node = cy.$(`#${id}`);
    if (node?.empty()) {
        node = cy.add({ group: 'nodes', data: { id: id, label: id } });
    }

    return {
        type: "query_result",
        keyword: line.keyword,
        query_object: ["nodes"],
        data: node,
        collection: node
    }
}
```

### Static Autocomplete (Commands & Objects)

Defining your autocomplete is important to helping users recognize your commands/objects. The autocomplete popup also provides users with a brief description in case they forget.

Defining a handler is done by passing a function to the `autocomplete` property of your [Extension Declaration](wiki/../wiki/Interface:%20ExtensionDeclaration). The function you define will receive an instance of [AutoCompleteRulesBuilder](wiki/../wiki/Class:%20AutoCompleteRulesBuilder).

#### Example ([Layout Object](../tree/main/prototype/src/extensions/layout.ts)):

```ts
function defineAutoComplete(autoCompleteRulesBuilder: InstanceType<typeof AutoCompleteRulesBuilder>) {
    autoCompleteRulesBuilder.defineLineStart({
        firstWord: "layout",
        displayText: `layout\n`,
        description: "Define properties for the layout algorithm."
    })
}
```

### Dynamic Property Autocomplete (Commands & Objects)

Commands and objects can define the autocomplete for the properties listed under their commands or objects. This is done by returning a list of [DynamicAutocomplete](wiki/../wiki/Interface:%20DynamicAutocomplete) objects in your [QueryResult](wiki/../wiki/Interface:%20QueryResult) return object.

It is highly recommended that your function call any `propertiesAutoComplete` function on parameters (in the case of a command) and concat with their returned list if your command returns a collection with elements from the query.

#### Example ([Layout Object](../tree/main/prototype/src/extensions/layout.ts)):

```ts
...
// Layout extension declaration
function init(core: InstanceType<typeof Core>) {
    core.defineHandler('object', "layout", new Layout(core));
}
...
// Extension logic
class Layout implements ObjectHandler {
    ...
    private generateAutoComplete(): DynamicAutocomplete[] {
        return [
            { insertText: "name", displayText: "name: [algorithm name]", description: "Specifies the layout algorithm for rendering the graph." },
            { insertText: "animate", displayText: "animate: [true / false]" },
            { insertText: "animationDuration", displayText: "animationDuration: [number]" }
        ];
    }
    execute({ line,properties }: ExecutedParameterObject<Grammar.Object>) {
        const data = { ...this.data, ...properties };
        this.updateLayout(data);
        this.data = data;
        const type : "object_result" = "object_result";
        return {
            type,
            query_object: [],
            keyword: line.keyword,
            data: line,
            extra: {},
            propertiesAutoComplete: this.generateAutoComplete
        };
    }
    ...
}

```