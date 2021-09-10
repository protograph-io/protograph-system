export declare class Router<HandlerType = Function> {
    private map;
    load(keyword: string, handler: HandlerType): void;
    loadAssertUnique(keyword: string, handler: HandlerType): void;
    get(keyword: string): HandlerType | undefined;
    has(keyword: string): boolean;
    forEach(f: Parameters<Map<string, HandlerType>["forEach"]>[0]): void;
    entries(): ReturnType<Map<string, HandlerType>["entries"]>;
}
