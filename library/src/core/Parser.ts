import peg from "pegjs";
import { base, GRAMMAR_INSERTS } from "../grammar/grammar";
import loader from "./ExtensionLoader";
import { Router } from "./Router";

/** Uses an internal incrementor to return locally safe prefixes. */
class UniquePrefix {
    prefix = "_";
    prefix_suffix = "_";
    inc = 0;
    /**
     * 
     * @returns Locally safe prefix.
     */
    get() {
        this.inc++;
        return this.prefix + this.inc + this.prefix_suffix;
    }
}

/** The specification for a grammar rule. Used to construct the grammar for the Parser. */
interface RuleDefinitionSpec {
    /**
     * The unique id used to define a grammar fragment for the respective grammar classes.
     * 
     * @remark There should not be a clash between any plugins.
     * @remark The namespace used to define gramamr fragments are unique for each grammar class (commands, objects, query objects, querys); so two separate classes can have a fragment with the same id.
     */
    keyword: string,
    /**
     * Used to display a friendly/readable name to the reader when if they make a syntax error.
     */
    humanReadableName: string,
    /**
     * The grammar fragment that is paired with a rule name. With the exception of defineFragment, this should not include a rule name, readable name, or equal sign. This is what is to the right of the equal sign of a grammar rule.
     */
    fragment: string,
}
/** Constructs a grammar for PEG.js */
export class GrammarBuilder {
    /**
     * Returns a unique prefix string useful for defining safe rule names.
     * 
     * @example `this.prefixer.get()`
     */
    prefixer = new UniquePrefix();
    constructor(private base: string) {
    }
    /**
     *  Used to construct a rule declaration (`rule_name "readable name" = expression`)
     * 
     * @remark Useful for constructing safe fragments.
     * @returns An object (`{ name: string, declaration: string }`). The declaration is what would be used as in the fragment. The name can be used to reference the rule in other grammar fragments.
    */
    constructRuleDefinition(
            keyword:string, 
            humanReadableName: string, 
            expression: string, 
            extraPrefix: string = "", 
            includeUniquePrefix = true
        ) : {name: string, declaration: string} 
        {
        // Ensures that extensions statements are germane and that names are unique to prevent rule clash
        const ruleName = (!!includeUniquePrefix ? this.prefixer.get() : "") + extraPrefix + keyword.trim();
        if (humanReadableName.includes(`"`)) throw Error("Extension grammar cannot have double quote")
        if (!humanReadableName.trim().length) throw Error("Extension grammar cannot be empty");
        expression = expression.replaceAll("\n", "")
        return {name: ruleName, declaration: `${ruleName} "${humanReadableName.trim()}" = ${expression.trim()}`.trim()};
    }
    /** @internal */
    generate() {
        let grammarString = this.base;

        // Commands
        const commands = Array.from(this.stores.command.entries(), (entry) => entry[1])
        const command_definitions = commands.map(({keyword,humanReadableName,fragment}) => this.constructRuleDefinition(keyword,humanReadableName,fragment));
        const command_names = command_definitions.map(item => item.name)
        // After replace looks like:
        // XXX = ext_name_3 / ext_name_2 / ext_name_1
        grammarString = grammarString.replace(GRAMMAR_INSERTS.COMMAND_EXTENSION_NAMES,command_names.reverse().join(" / "))
        // After replace looks like:
        // ext_name_1 = ...
        // ext_name_2 = ...
        // ext_name_3 = ...
        const command_rule_declarations = command_definitions.map(item => item.declaration);
        grammarString = grammarString.replace(GRAMMAR_INSERTS.COMMAND_EXTENSION_declarationS,command_rule_declarations.join("\n"));

        // Objects
        const objects = Array.from(this.stores.object.entries(), (entry) => entry[1])
        const object_definitions = objects.map(({keyword,humanReadableName,fragment}) => this.constructRuleDefinition(keyword,humanReadableName,fragment));
        const object_names = object_definitions.map(item => item.name)
        grammarString = grammarString.replace(GRAMMAR_INSERTS.OBJECT_EXTENSION_NAMES,object_names.reverse().join(" / "))
        const object_rule_declarations = object_definitions.map(item => item.declaration);
        grammarString = grammarString.replace(GRAMMAR_INSERTS.OBJECT_EXTENSION_declarationS,object_rule_declarations.join("\n"));

        // Queries
        // Query Object Queries
        const query_objects = Array.from(this.stores.query_object.entries(), (entry) => entry[1])
        const queries_declarations_by_object = query_objects.map(qo => {
            const querys = Array.from(qo.store.entries(), (entry) => entry[1]) as RuleDefinitionSpec[];
            const query_definitions = querys.map(({keyword,humanReadableName,fragment}) => this.constructRuleDefinition(keyword,humanReadableName,fragment, qo.keyword + "_"));
            const query_names = query_definitions.map(item => item.name);
            
            return {
                ...qo,
                subrules: query_names,
                subdeclarations: query_definitions.map(item => item.declaration)
            }
        }); // Don't add empty rules
        
        const query_object_rule_name_prefix = "query_object_";
        
        // Query Objects
        const query_object_names = query_objects.map(qo => query_object_rule_name_prefix + qo.keyword)
        grammarString = grammarString.replace(GRAMMAR_INSERTS.QUERY_OBJECT_EXTENSION_NAMES,query_object_names.reverse().join(" / "));

        // Define each query object with its list of subrules
        const query_object_declarations = queries_declarations_by_object.map(qo => this.constructRuleDefinition(qo.keyword, qo.humanReadableName, qo.subrules.reverse().join(" / "), query_object_rule_name_prefix, false).declaration);
        grammarString = grammarString.replace(GRAMMAR_INSERTS.QUERY_OBJECT_EXTENSION_declarationS,query_object_declarations.join("\n"));

        // Add each indiviudal query exntension
        const query_object_query_declarations = queries_declarations_by_object.reduce((agg : string[],qo) => [...agg,...qo.subdeclarations], []);
        grammarString = grammarString.replace(GRAMMAR_INSERTS.QUERY_EXTENSION_declarationS,query_object_query_declarations.join("\n"));

        // Add fragments to the end
        grammarString += "\n" + this.stores.fragment.join("\n");

        // console.log("Full generated grammar", grammarString);
        
        return grammarString;
    }

    private stores = {
        command: new Router<RuleDefinitionSpec>(),
        object: new Router<RuleDefinitionSpec>(),
        query_object: new Router<Omit<RuleDefinitionSpec, "fragment"> & {store: InstanceType<typeof Router>}>(),
        // query: new Router<RuleDefinitionSpec>(),
        fragment: [] as string[],
    }
    /**
     * Defines an object in the grammar.
     * 
     * @param keyword The internally reserved name and the word users type to reference this object.
     * @param humanReadableName The human readable name provided to users if there is a syntax error.
     * @param fragment 
     * The expression assigned to the grammar rule.
     * The grammar expression must return 
     * ```
     * {type: "object", keyword: YOUR_KEYWORD/HANDLER_KEYWORD, parameters: any[], namedParameters: any{}}
     * ```
     * 
     * @remark Parameters and named parameters must be of type string, number, or the return value of a query. If you need to return an object/array do so with an object{type: "plain", ...anyPropertiesCanGoHere}; this tells the interpretter to return the raw parameter when trying to evaluate parameters.
     * 
     * @example
     * ```ts
     * const fragment = `'layout'i {return {type: "object", keyword: "layout", parameters: []} }`;
     * grammarBuilder.defineGrammarObject("layout", "Layout", fragment);
     * ```
     */
    defineGrammarObject(
        keyword: string,
        humanReadableName: string,
        fragment: string
    ) : void {
        this.stores["object"].load(keyword, { keyword, humanReadableName, fragment });
    }
    /**
     * Defines a command in the grammar.
     * 
     * @param keyword The internally reserved name and the first word of a code line to trigger a handler.
     * @param humanReadableName The human readable name provided to users if there is a syntax error.
     * @param fragment 
     * The expression assigned to the grammar rule.
     * The grammar expression must return 
     * ```
     * {type: "command", keyword: YOUR_KEYWORD/HANDLER_KEYWORD, parameters: any[], namedParameters: any{}}
     * ```
     * 
     * @remark Objects must have a unique (across all plugins) keyword/trigger string at the beginning of the grammar expression (in the example this is "layout").
     * 
     * @remark It is recommended to make all string literals, including the keyword, case insenstive by appending `i` after the string (e.g. `'layout'i`).
     * 
     * @remark A command can reference "query", "query_object_nodes", "query_objects_edges" or any other defined query object to expect a query. A query must be returned in the `parameters`/`namedParameters` to be evaluated.
     * 
     * @remark Parameters and named parameters must be of type string, number, or the return value of a query. If you need to return an object/array do so with an object{type: "plain", ...anyPropertiesCanGoHere}; this tells the interpretter to return the raw parameter when trying to evaluate parameters.
     * 
     * @example
     * ```ts
     * const expression = `"connect"i  sp p:query { return {keyword: "connect", parameters:[p] } }`;
    grammarBuilder.defineGrammarCommand("connect", "Connect [Query]", expression);
     * ```
     */
    defineGrammarCommand(
        keyword: string,
        humanReadableName: string,
        fragment: string
    ) : void {
        this.stores["command"].load(keyword, { keyword, humanReadableName, fragment });
    }
    private defineGrammarQueryObject(keyword: string, humanReadableName : string | null = null) {
        if (!humanReadableName) humanReadableName = "Query Object " + keyword;
        this.stores["query_object"].load(keyword, { keyword, humanReadableName, store:  new Router<string>() });
    }
    /**
     * Defines a query in the grammar.
     * 
     * @param object The object class that the query operates on. The core ones are "nodes", "edges". A new one can be defined by just using a new object name. Object names are not prefixed or modified and thus can be used in expressions by any extension developer (e.g. someone building an algorithm command can reference a query for edges with the "query_object_edges" rule). If a query operates on multiple objects, it should be defined once for each object.
     * @param keyword The internally reserved name but is not typed by users. 
     * @param humanReadableName The human readable name provided to users if there is a syntax error.
     * @param fragment 
     * The expression assigned to the grammar rule.
     * The grammar expression must return 
     * ```
     * {type: "query", keyword: YOUR_KEYWORD/HANDLER_KEYWORD, parameters: any[], namedParameters: any{}}
     * ```
     * 
     * @remark If a query operates on multiple objects, it should be defined once for each object. Other grammar classes automatically incorporate grammar scoping by requiring a unique first word, queries do not do this, therefore it is extremely important the developer chooses an expression that will not loop forever or clash with other declarations.
     * 
     * 
     * @remark It is recommended to make all string literals, including the keyword, case insenstive by appending `i` after the string (e.g. `"connect"i`).
     * 
     * @remark Parameters and named parameters must be of type string, number, or the return value of a query. If you need to return an object/array do so with an object{type: "plain", ...anyPropertiesCanGoHere}; this tells the interpretter to return the raw parameter when trying to evaluate parameters.
     * 
     * @example
     * ```ts
     * grammarBuilder.defineGrammarFragment(`edge_type = "to"i / "with"i / "<-" / "->" / "-" / "from"i`);
    const expression = `
    left:(
	 *      l:query_object_nodes sp* t:edge_type sp * {return [l,t]}
    ) + right:(query_object_nodes) {return {type: "query", keyword: "edge", parameters:[...left,right].flat()}}
    `;
    grammarBuilder.defineGrammarQuery("edges", "query_edge", "Query: Edge: [Node] [Type] [Node]", expression);
     * ```
     */
    defineGrammarQuery(
        object: string,
        keyword: string,
        humanReadableName: string,
        fragment: string
    ) : void {
        if (!this.stores["query_object"].has(object)) {
            this.defineGrammarQueryObject(object)
        }
        const map = this.stores["query_object"].get(object);
        // if (!map) throw Error("Grammar query object does not exist");
        if (!map) throw Error("This error should never occur")
        map.store.load(keyword, { keyword, humanReadableName, fragment });
    }

    defineGrammarFragment(fragment: string) : void {
        this.stores["fragment"].push(fragment);
    }

}

export class SyntaxHighlightingBuilder {
    base : any = {};
    setBase(mode: any) {
        this.base = mode;
    }
    commands = new Set<string>();
    objects = new Set<string>();
    defineObject(
        keyword: string,
    ) {
        this.objects.add(keyword);
    }
    defineCommand(
        keyword: string,
    ) {
        this.commands.add(keyword);
    }
    private startOfLineRegex(options : string[]) {
        return new RegExp(`(${options.join("|")})(\\/\\/.*$|$|\\s)`, 'gi')
    }
    generateHighlighting() : any {
        const mode = {...this.base};
        mode.start = [...mode.start];
        mode.start.push({
            regex: this.startOfLineRegex(Array.from(this.commands.values())),
            sol: true,
            token: "keyword"
        });
        mode.start.push({
            regex: this.startOfLineRegex(Array.from(this.objects.values())),
            sol: true,
            token: "def"
        });
        // console.log(mode);
        return mode;
    }
}

export class GrammarBuilderWithSyntaxHighlighting extends GrammarBuilder implements GrammarBuilder {
    
    syntaxHighlightingBuilder = new SyntaxHighlightingBuilder();

    defineGrammarObject(
        keyword: string,
        humanReadableName: string,
        fragment: string
    ) {
        this.syntaxHighlightingBuilder.defineObject(keyword);
        super.defineGrammarObject(keyword, humanReadableName, fragment);
    }
    defineGrammarCommand(
        keyword: string,
        humanReadableName: string,
        fragment: string
    ) {
        this.syntaxHighlightingBuilder.defineCommand(keyword);
        super.defineGrammarCommand(keyword, humanReadableName, fragment);
    }

    generateHighlighting() {
        return this.syntaxHighlightingBuilder.generateHighlighting();
    }
}

export class ParserBuilder {
    public builder = new GrammarBuilderWithSyntaxHighlighting(base);
    constructor(includeWindowExtensions: null | string[] = null) {
        // if includeWindowExtensions === null, then load all otherwise pass array
        let extensionsToLoad = Array.from(loader.entries());
        if (Array.isArray(includeWindowExtensions)) {
            // Use includeWindowExtensions to filter window set extensions
            extensionsToLoad = extensionsToLoad.filter(([name, f]) => includeWindowExtensions.includes(name));
        }
        for (let [, extensionExec] of extensionsToLoad) {
            // Pass extension core
            extensionExec.grammar && extensionExec.grammar(this.builder);
        }
    }
    generate() {
        return peg.generate(this.builder.generate())
    }
    generateSyntaxHighlighting() : any {
        return this.builder.generateHighlighting();
    }
}

export { };
