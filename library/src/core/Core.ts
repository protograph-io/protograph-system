import CodeMirror from 'codemirror';
import cytoscape from 'cytoscape';
import { Grammar } from "../grammar/grammar.types";
import { CytoscapeInstance } from '../renderer/renderer';
import { AutoCompleteBuilder } from './AutoComplete';
import "./default_extensions";
import loader from './ExtensionLoader';
import { isObjAndHas, logEvaluation } from './helpers';
import { BaseQueries, Utility } from './types';
import { Router } from "./Router";
import { CommandHandler, ObjectHandler, QueryHandler, EvaluatedParameter } from "./types";
import { StylePropertiesHandler } from './StyleProperties';

export const defaultStyles: cytoscape.Stylesheet[] = [{
    selector: "node",
    style: {
        "background-color": "lightgray",
        "transition-property": "background-color",
        "text-valign": "center"
        // "label": 'data(id)'
    }
}, {
    // Selects parent of nodes
    // `$ (subject selector) Sets the subject of the selector (e.g. $node > node to select the parent nodes instead of the children).`
    selector: "$node node",
    style: {
        "background-color": "white",
        "border-color": "black",
        "transition-property": "background-color, border-color",
        "border-width": 2,
        // "label": 'data(id)'
    }
}, {
    selector: "edge",
    style: {
        // "line-color": "black",
        "line-color": "lightgray",
        "curve-style": "bezier",
        // "target-arrow-color": "black",
        // "source-arrow-color": "black",
        "target-arrow-color": "lightgray",
        "source-arrow-color": "lightgray",
        "transition-property": "all"
    }
}, {
    selector: "edge[directed='true']",
    style: {
        "target-arrow-shape": "triangle",
    }
}];

// Used to ensure that enact onAnimateComplete style functions fire in order of created instead of which finishes first which is unreliable because of browser timers.
export class OrderedComplete {
    constructor(public limit: null | undefined | number = undefined) {
        // console.log("OrderedComplete: constructed", limit);
    }
    callbacks: Function[] = []
    add(f: Function) {
        this.callbacks.push(f);
        // console.log("OrderedComplete: add", this.callbacks.length, this.callbacks, f);
    }
    count = 0;
    markReady() {
        this.count += 1;
        // console.log("OrderedComplete: ready", this.count);
    }
    isComplete() {
        let criteria = this.callbacks.length;
        if (this.limit !== undefined && this.limit !== null) criteria = this.limit;
        // console.log("OrderedComplete: isComplete", this.count, criteria);
        return this.count === criteria;
    }
    tryComplete() {
        this.isComplete() && this.complete();
    }
    complete() {
        // console.log("OrderedComplete: complete", this.count, this.callbacks);
        // Without setTimeout the style is only applied to some elements in the collection
        this.callbacks.forEach((f, i) => window.setTimeout(() => f(), i * 0));
        this.callbacks.length = 0;
        this.count = 0;
    }
}

/**
 * The config interface for a core.
 */
export interface CoreConfig {
    animate_duration: number;
}
function setPositions(props: Grammar.Properties, eles: cytoscape.Collection) {
    if (!props) return;
    if (!("parent" in props)) return;
    const nodes: cytoscape.Collection = eles.filter("node");
    // @ts-ignore
    if (!nodes.empty()) nodes.move({ parent: props.parent.toString() });
}
function setParent(props: Grammar.Properties, eles: cytoscape.Collection) {
    if (!props) return;
    const position: cytoscape.Position = {
        ...(("x" in props) ? { x: Number(props.x) } : {}),
        ...(("y" in props) ? { y: Number(props.y) } : {}),
    } as cytoscape.Position;
    const nodes: cytoscape.Collection = eles.filter("node");
    // @ts-ignore
    if (!nodes.empty()) nodes.positions(position);
}
/**
 * Core which routes parsed grammar JSON to (command/query/object) handlers.
 */
export class Core {
    private routers = {
        command: new Router<CommandHandler>(),
        object: new Router<ObjectHandler>(),
        query: new Router<QueryHandler>(),
    }
    stylePropertiesHandler = new StylePropertiesHandler();
    /**
     * The config object for a core. If a core is manually integrating things like animations, it should reference the core.config to be consistant with other behaviors.
     */
    public config: CoreConfig = {
        animate_duration: 500
    }
    // if includeWindowExtensions === null, then load all otherwise pass array
    constructor(public cy: CytoscapeInstance | undefined = undefined, public parser: PEG.Parser, config: Partial<CoreConfig> = {}, includeWindowExtensions: null | string[] = null) {
        this.config = { ...this.config, ...config };

        this.cy?.style(defaultStyles)

        // if includeWindowExtensions === null, then load all otherwise pass array
        let extensionsToLoad = Array.from(loader.entries());
        if (Array.isArray(includeWindowExtensions)) {
            // Use includeWindowExtensions to filter window set extensions
            extensionsToLoad = extensionsToLoad.filter(([name, f]) => includeWindowExtensions.includes(name));
        }
        for (let [, extensionExec] of extensionsToLoad) {
            // Pass extension core
            extensionExec.exec(this);
        }
    }
    /**
     * 
     * Define a handler for an extension. Necessary for every non-utility extension.
     * 
     * @param type 
     * @param keyword The reserved word within the type namespace. Also the return type of the grammar fragment.
     * @param handler The function (for command or query) or class with execute method (for object) that is called when the core finds a input fragment for this keyword.
     * 
     * @see {@link CommandHandler}
     * @see {@link ObjectHandler}
     * @see {@link QueryHandler}
     */
    public defineHandler(
        type: 'command' | 'object' | 'query',
        keyword: Parameters<InstanceType<typeof Core>["routers"][typeof type]["load"]>[0],
        handler: Parameters<InstanceType<typeof Core>["routers"][typeof type]["load"]>[1]) {
        // @ts-ignore
        this.routers[type].load(keyword, handler);
    }
    private utilitySet = new Router<Utility>();
    /**
     * 
     * Allows utilities (general potentially stateful logic) to be defined and be accessible to any class.
     * 
     * @param keyword The keyword to access the utility.
     * @param util The utility (class instance/function/variable) itself.
     * 
     * @example
     * ```ts
     * core.defineUtility("IdGenerator", new BaseUtilities.IdGenerator());
     * ```
     */
    defineUtility(keyword: string, util: Utility) {
        this.utilitySet.loadAssertUnique(keyword, util)
    }
    getUtility(keyword: string): Utility | undefined {
        return this.utilitySet.get(keyword);
    }
    getObject(keyword: string): ObjectHandler | undefined {
        return this.routers.object.get(keyword);
    }
    public autoCompleteBuilder: AutoCompleteBuilder | undefined;
    public cm: CodeMirror.Editor | undefined;
    public evaluate(line: Grammar.Line | Grammar.Parameters[number], carryOverProperties?: Grammar.Properties, isRootCall = false, animate: boolean = true, orderedComplete?: OrderedComplete): EvaluatedParameter {
        line = JSON.parse(JSON.stringify(line));
        // Temporary fix for extensions that might reference animate_duration but evaluate has animate flag override
        const _originalAnimationDuration = this.config.animate_duration;
        if (!animate) this.config.animate_duration = 0;
        logEvaluation("evaluated type start")
        let evaluateResult;
        if (isObjAndHas(line, "type")) {
            const handler = this.handlers[(line as Grammar.Line).type];
            let res: ReturnType<typeof handler>;
            try {
                // @ts-ignore
                res = handler(line, carryOverProperties);
            } catch (e) {
                // try autocomplete
                if (typeof line === 'object' && line !== null && "returnAutoComplete" in line && line.type !== "plain") {
                    const objectHander = this.routers.object.get(line.keyword);
                    if (objectHander?.propertiesAutoComplete) {
                        this.cm && this.autoCompleteBuilder?.showPropertiesHint(this.cm, objectHander.propertiesAutoComplete(), line.type, this.stylePropertiesHandler);
                    }
                }
                throw e;
            }
            logEvaluation("evaluated type line", res)

            // @ts-ignore
            // console.log("Trying Dynamic Autocomplete", typeof line === 'object', line !== null, "returnAutoComplete" in line, typeof res === 'object', res !== null, "propertiesAutoComplete" in res, res.propertiesAutoComplete);
            if (typeof line === 'object' && line !== null
                && "returnAutoComplete" in line
                && res
                && typeof res === 'object' && res !== null
                && "propertiesAutoComplete" in res && res.propertiesAutoComplete
                && line.type !== "plain") {
                this.cm && this.autoCompleteBuilder?.showPropertiesHint(this.cm, res.propertiesAutoComplete(), line.type, this.stylePropertiesHandler);
            } else if (typeof line === 'object' && line !== null
                && "returnAutoComplete" in line
                && line.type !== "plain") {
                this.cm && this.autoCompleteBuilder?.showPropertiesHint(this.cm, [], line.type, this.stylePropertiesHandler);
            }

            // @ts-ignore
            if (line.properties && res && (res as BaseQueries.Result).collection && !res.collection.empty()) {
                let props: Grammar.Properties = (line as Grammar.Line).properties || {};
                props = { ...((typeof res === 'object' && res !== null && res.extraCollectionProperties) || {}), ...props }
                // Do we want to handle this here and then allow others to define property handlers?
                // Or do we want to keep it in the commmands/queries? This means it passed along
                // Maybe both
                // @ts-ignore
                const validStyleProps = this.stylePropertiesHandler.filterAndParse(props);

                // Cytoscape selectors only support numbers and strings
                const dataProps = Object.fromEntries(Object.entries(props as Grammar.Properties).map(([k, val]) => [k, (val && typeof val !== 'number') ? val.toString() : val]));
                // @ts-ignore
                res.collection.data(dataProps) // Styles should also go in data for querying
                if (animate && this.config.animate_duration) {
                    if (orderedComplete === undefined) orderedComplete = new OrderedComplete(1);
                    orderedComplete.add(() => {
                        // @ts-ignore
                        res.collection.style(validStyleProps)
                        // @ts-ignore
                        line && props && setPositions(props as unknown as Grammar.Properties, res.collection);
                        // @ts-ignore
                        line && props && setParent(props as unknown as Grammar.Properties, res.collection);
                    });
                    // @ts-ignore
                    res.collection.animate({
                        // @ts-ignore
                        style: { ...validStyleProps },
                        // @ts-ignore
                        ...((!res.collection.filter("node").empty() && line && props && (("x" in props) || ("y" in props))) ? {
                            position: {
                                // @ts-ignore
                                ...(("x" in props) ? { x: Number(props.x) } : {}),
                                // @ts-ignore
                                ...(("y" in props) ? { y: Number(props.y) } : {}),
                            }
                        } : {})
                    }, {
                        duration: this.config.animate_duration,
                        // IMPORTANT: REQUIRED to have all commands in one step animate at the same time
                        queue: false,
                        // IMPORTANT: REQUIRED to have *unsupported* style properties updated
                        // Could not find documentation why or if there are unsupported animation style properties but line-style, node shape were not updating with an animation call
                        // ... so animate what can be animated then update the rest at the end of the animation.
                        complete: () => {
                            // Used to ensure that enact onAnimateComplete style functions fire in order of created instead of which finishes first which is unreliable because of browser timers.
                            orderedComplete?.markReady();
                            orderedComplete?.tryComplete();
                        }
                    });
                }
                else {
                    // @ts-ignore
                    res.collection.style(validStyleProps)
                    // @ts-ignore
                    line && props && setPositions(props as unknown as Grammar.Properties, res.collection);
                    // @ts-ignore
                    // res.collection.animate({
                    //     // @ts-ignore
                    //     style: { ...validStyleProps }
                    // }, {
                    //     duration: this.config.animate_duration,
                    //     queue: false
                    // });
                }

            }

            // @ts-ignore
            evaluateResult = res;
        } else {

            // This allows defining of plain/raw parameters
            logEvaluation("evaluated type plain", line)
            evaluateResult = line as EvaluatedParameter;
        }

        if (!animate) this.config.animate_duration = _originalAnimationDuration;

        // @ts-ignore
        return evaluateResult;
    }
    public update() {
        this.cy?.elements().forEach(ele => {
            if ("x" in ele.data() || "y" in ele.data()) ele.lock();
        })
        this.routers.object.forEach((handler: ObjectHandler) => {
            // log("handler", handler)
            handler.onChange();
        })
        this.utilitySet.forEach((handler: Utility) => {
            // log("handler", handler)
            handler && handler.onChange && handler.onChange();
        })
        this.cy?.elements().forEach(ele => {
            if ("x" in ele.data() || "y" in ele.data()) ele.unlock();
        })
    }
    public reset() {
        this.routers.object.forEach((handler: ObjectHandler) => {
            // log("handler", handler)
            handler && handler.reset && handler.reset();
        })
        this.utilitySet.forEach((handler) => {
            // log("handler", handler)
            handler && handler.reset && handler.reset();
        })
    }
    private parseParameters(parameters: Grammar.Parameters = [], properties?: Grammar.Properties) {
        return parameters.map(p => this.evaluate(p, properties))
    }
    private parseNamedParameters(parameters: Grammar.NamedParameters = {}, properties?: Grammar.Properties) {
        return Object.fromEntries(Object.entries(parameters || {}).map(
            ([k, v]) => [k, this.evaluate(v, properties)]
        ));
    }
    private handlers = {
        plain: (line: Grammar.Plain, carryOverProperties?: Grammar.Properties) => {
            return {
                type: "plain",
                keyword: null,
                data: line,
                extra: {}
            };
        },
        command: (line: Grammar.Command, carryOverProperties?: Grammar.Properties) => {
            const handler = this.routers.command.get(line.keyword);

            // Verify handler exists
            if (!handler) return;
            // Evaluate parameters
            const evaluatedParameters = this.parseParameters(line.parameters)
            const evaluatedNamedParameters = this.parseNamedParameters(line.named_parameters);
            // Merge all extra properties from parameters
            let extraProperties = [...evaluatedParameters, ...Object.values(evaluatedNamedParameters)]
                .reduce((agg: Record<string, any>, res: EvaluatedParameter) => {
                    return { ...agg, ...((typeof res === 'object' && res !== null && res.extraCollectionProperties) || {}) }
                }, {});

            const res = handler({
                core: this,
                parser: this.parser,
                parameters: evaluatedParameters,
                namedParameters: evaluatedNamedParameters,
                properties: { ...carryOverProperties, ...(line.properties || {}) },
                line
            });
            if (typeof res === 'object' && res !== null) {
                res.extraCollectionProperties = { ...extraProperties, ...(res.extraCollectionProperties || {}) }
            }

            return res;
        },
        object: (line: Grammar.Object, carryOverProperties: Grammar.Properties = {}) => {
            const objectHander = this.routers.object.get(line.keyword);
            if (!objectHander) throw Error("Unsupported Object");

            const lineProperties: Grammar.Properties = ("properties" in line && line.properties) ? line.properties : {};
            const properties = {
                ...(carryOverProperties || {}),
                ...lineProperties
            };
            const evaluatedParameters = this.parseParameters(line.parameters, properties)
            const evaluatedNamedParameters = this.parseNamedParameters(line.named_parameters, properties);
            let extraProperties = [...evaluatedParameters, ...Object.values(evaluatedNamedParameters)]
                .reduce((agg: Record<string, any>, res: EvaluatedParameter) => {
                    return { ...agg, ...((typeof res === 'object' && res !== null && res.extraCollectionProperties) || {}) }
                }, {});

            // return objectHander.execute(line, { ...carryOverProperties, ...line.properties });
            const res = objectHander.execute({
                core: this,
                parser: this.parser,
                line,
                parameters: evaluatedParameters,
                namedParameters: evaluatedNamedParameters,
                properties: {
                    ...carryOverProperties, ...line.properties
                }
            });
            if (typeof res === 'object' && res !== null) {
                res.extraCollectionProperties = { ...extraProperties, ...(res.extraCollectionProperties || {}) }
            }
            return res;
        },
        query: (line: (Grammar.QueryLine | Grammar.Query), carryOverProperties?: Grammar.Properties): EvaluatedParameter => {
            logEvaluation("Beginning query", line);
            const handler = this.routers.query.get(line.keyword);

            // Verify handler exists
            if (!handler) {
                console.log("Tried ", line.keyword, " Only have ", Array.from(this.routers.query.entries()).map(([n]) => n))
                throw Error("Query Handler Doesn't Exist");
            }
            // Evaluate parameters
            const lineProperties: Grammar.Properties = ("properties" in line && line.properties) ? line.properties : {};
            // Merge properties
            const properties = {
                ...(carryOverProperties || {}),
                ...lineProperties
            };
            const evaluatedParameters = this.parseParameters(line.parameters, properties)
            const evaluatedNamedParameters = this.parseNamedParameters(line.named_parameters, properties);
            let extraProperties = [...evaluatedParameters, ...Object.values(evaluatedNamedParameters)]
                .reduce((agg: Record<string, any>, res: EvaluatedParameter) => {
                    return { ...agg, ...((typeof res === 'object' && res !== null && res.extraCollectionProperties) || {}) }
                }, {});


            const res = handler({
                core: this,
                parser: this.parser,
                parameters: evaluatedParameters,
                namedParameters: evaluatedNamedParameters,
                properties,
                line,
            });
            if (typeof res === 'object' && res !== null) {
                res.extraCollectionProperties = { ...extraProperties, ...(res.extraCollectionProperties || {}) }
            }
            return res;
        }
    }
}