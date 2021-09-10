import CodeMirror from 'codemirror';
import cytoscape from 'cytoscape';
import { Grammar } from "../grammar/grammar.types";
import { CytoscapeInstance } from '../renderer/renderer';
import { AutoCompleteBuilder } from './AutoComplete';
import "./default_extensions";
import { Utility } from './types';
import { ObjectHandler, EvaluatedParameter } from "./types";
import { StylePropertiesHandler } from './StyleProperties';
export declare const defaultStyles: cytoscape.Stylesheet[];
export declare class OrderedComplete {
    limit: null | undefined | number;
    constructor(limit?: null | undefined | number);
    callbacks: Function[];
    add(f: Function): void;
    count: number;
    markReady(): void;
    isComplete(): boolean;
    tryComplete(): void;
    complete(): void;
}
export interface CoreConfig {
    animate_duration: number;
}
export declare class Core {
    cy: CytoscapeInstance | undefined;
    parser: PEG.Parser;
    private routers;
    stylePropertiesHandler: StylePropertiesHandler;
    config: CoreConfig;
    constructor(cy: CytoscapeInstance | undefined, parser: PEG.Parser, config?: Partial<CoreConfig>, includeWindowExtensions?: null | string[]);
    defineHandler(type: 'command' | 'object' | 'query', keyword: Parameters<InstanceType<typeof Core>["routers"][typeof type]["load"]>[0], handler: Parameters<InstanceType<typeof Core>["routers"][typeof type]["load"]>[1]): void;
    private utilitySet;
    defineUtility(keyword: string, util: Utility): void;
    getUtility(keyword: string): Utility | undefined;
    getObject(keyword: string): ObjectHandler | undefined;
    autoCompleteBuilder: AutoCompleteBuilder | undefined;
    cm: CodeMirror.Editor | undefined;
    evaluate(line: Grammar.Line | Grammar.Parameters[number], carryOverProperties?: Grammar.Properties, isRootCall?: boolean, animate?: boolean, orderedComplete?: OrderedComplete): EvaluatedParameter;
    update(): void;
    reset(): void;
    private parseParameters;
    private parseNamedParameters;
    private handlers;
}
