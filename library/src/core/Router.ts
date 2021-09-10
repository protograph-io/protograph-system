// Keywords are case-insensitive

/**
 * @internal
 */
export class Router<HandlerType = Function> {
    private map = new Map<string, HandlerType>();
    load(keyword: string, handler: HandlerType) {
        this.map.set(keyword.toLowerCase(), handler);
    }
    loadAssertUnique(keyword: string, handler: HandlerType) {
        if (this.map.has(keyword.toLowerCase())) throw Error("Grammar keyword already in use");
        this.load(keyword, handler);
    }
    get(keyword: string) {
        return this.map.get(keyword.toLowerCase());
    }
    has(keyword: string) {
        return this.map.has(keyword.toLowerCase());
    }
    forEach(f: Parameters<Map<string, HandlerType>["forEach"]>[0]) {
        // @ts-ignore
        return this.map.forEach(f);
    }
    entries(): ReturnType<Map<string, HandlerType>["entries"]> {
        // @ts-ignore
        return this.map.entries();
    }
}