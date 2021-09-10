export declare const logStateChange: (...par: any[]) => boolean;
export declare const logEvaluation: (...par: any[]) => boolean;
export declare const log: (...par: any[]) => boolean;
export declare const isObjAndHas: (obj: Object, key: string) => boolean;
export declare const isObjAndEquals: (obj: Record<string, any>, key: string, value: any) => boolean;
export declare const isObjAndIncludes: (obj: Record<string, any>, key: string, value: any) => boolean;
export declare function debounce<T extends Function>(cb: T, wait?: number): (...args: any) => void;
