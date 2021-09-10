import peg from "pegjs";
declare class UniquePrefix {
    prefix: string;
    prefix_suffix: string;
    inc: number;
    get(): string;
}
export declare class GrammarBuilder {
    private base;
    prefixer: UniquePrefix;
    constructor(base: string);
    constructRuleDefinition(keyword: string, humanReadableName: string, expression: string, extraPrefix?: string, includeUniquePrefix?: boolean): {
        name: string;
        declaration: string;
    };
    generate(): string;
    private stores;
    defineGrammarObject(keyword: string, humanReadableName: string, fragment: string): void;
    defineGrammarCommand(keyword: string, humanReadableName: string, fragment: string): void;
    private defineGrammarQueryObject;
    defineGrammarQuery(object: string, keyword: string, humanReadableName: string, fragment: string): void;
    defineGrammarFragment(fragment: string): void;
}
export declare class SyntaxHighlightingBuilder {
    base: any;
    setBase(mode: any): void;
    commands: Set<string>;
    objects: Set<string>;
    defineObject(keyword: string): void;
    defineCommand(keyword: string): void;
    private startOfLineRegex;
    generateHighlighting(): any;
}
export declare class GrammarBuilderWithSyntaxHighlighting extends GrammarBuilder implements GrammarBuilder {
    syntaxHighlightingBuilder: SyntaxHighlightingBuilder;
    defineGrammarObject(keyword: string, humanReadableName: string, fragment: string): void;
    defineGrammarCommand(keyword: string, humanReadableName: string, fragment: string): void;
    generateHighlighting(): any;
}
export declare class ParserBuilder {
    builder: GrammarBuilderWithSyntaxHighlighting;
    constructor(includeWindowExtensions?: null | string[]);
    generate(): peg.Parser;
    generateSyntaxHighlighting(): any;
}
export {};
