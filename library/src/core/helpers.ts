
// Logging Helpers 
const enableLogs = false;
const enableStateLogs = false;
export const logStateChange = (...par: any[]) => enableLogs && enableStateLogs && console.log(...par);
const enableEvaluationLogs = false;
export const logEvaluation = (...par: any[]) => enableLogs && enableEvaluationLogs && console.log(...par);
export const log = (...par: any[]) => enableLogs && console.log(...par);


// Conditional Helpers 
export const isObjAndHas = (obj: Object, key: string): boolean => {
    return typeof obj === 'object' && obj !== null && key in obj
}
export const isObjAndEquals = (obj: Record<string, any>, key: string, value: any): boolean => {
    return typeof obj === 'object' && obj !== null && key in obj && obj[key] === value
}
export const isObjAndIncludes = (obj: Record<string, any>, key: string, value: any): boolean => {
    return typeof obj === 'object' && obj !== null && key in obj && obj[key].includes(value)
}

// https://gist.github.com/ca0v/73a31f57b397606c9813472f7493a940
export function debounce<T extends Function>(cb: T, wait = 20) {
    let h: ReturnType<Window["setTimeout"]>;
    let callable = (...args: any) => {
        clearTimeout(h);
        h = window.setTimeout(() => cb(...args), wait);
    };
    return callable;
}