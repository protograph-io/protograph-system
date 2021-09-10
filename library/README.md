# ProtoGraph

ProtoGraph is an extensible graph (node-link) visualization and animation system.

This repo showcases the ProtoGraph System implemented in JavaScript with PEG.js, CodeMirror, and Cystoscape.

## Protograph Language

The ProtoGraph language is designed to allow for quick and easy design of graph (node-link) visualizations and animations for users with varying levels of technical experience. Thus the system emphasizes expressivity of structure and animation along with learnability and efficiency as defined by the principles of "usability" [Nielsen].

The language has three facets:
- Queries: which allow the user to specify a set of elements or graph components (e.g. `select nodes where color = green`).
- Commands: which allow the user to perform an action (e.g. `add`, `connect`, `align`).
- Objects: which allow the user to edit graph structures/graph-wide properties/ProtoGraph properties (e.g. `graph layout`).

The language passes data with:
- Parameters: values described in the main user code line.
- Properties: a (YAML hash style) key-value list the user can type under a query, command, or object. 

```apache
CONNECT (select nodes where price < 100000) with (select nodes where state = MA) ...
    label : sold
    group : affordable
    company : "real estate today"
```

While parameters are specified by the grammar defined by the extension, the user is allowed to define any property they want, in addition to the set of style properties, and all properties get loaded into the data attributes of the elements returned by the query or command.

However, objects define their own properties and can restrict the allowed properties.

The language itself does not specify or define any commands, queries, or objects other than the `step` keyword. Everything is an extension. Core extensions can be found in [`src/extensions/`](../../tree/main/prototype/src/extensions).

## ProtoGraph Implementation Architecture

The main (internal) components of this implementation are:
- **Parser**: this component builds a PEG.js grammar (out of a base syntax and extension rules) and uses the grammar to generate a JSON object of the user's input. Parsing of the input does not alter the graph representation.
- **Interpreter (Core)**: this component accepts the JSON output of the **Parser**, and passes  JSON sub-objects to the respective extension handlers. The interpreter enacts changes to the graph representation.
- **Renderer**: this components orchestrate when the **Interpreter** evaluates particular fragments of the **Parser** JSON. It also pairs an **Interpreter** with a specific Cytoscape implementation.