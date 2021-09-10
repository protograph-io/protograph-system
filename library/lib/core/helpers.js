var enableLogs = false;
var enableStateLogs = false;
export var logStateChange = function () {
    var par = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        par[_i] = arguments[_i];
    }
    return enableLogs && enableStateLogs && console.log.apply(console, par);
};
var enableEvaluationLogs = false;
export var logEvaluation = function () {
    var par = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        par[_i] = arguments[_i];
    }
    return enableLogs && enableEvaluationLogs && console.log.apply(console, par);
};
export var log = function () {
    var par = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        par[_i] = arguments[_i];
    }
    return enableLogs && console.log.apply(console, par);
};
export var isObjAndHas = function (obj, key) {
    return typeof obj === 'object' && obj !== null && key in obj;
};
export var isObjAndEquals = function (obj, key, value) {
    return typeof obj === 'object' && obj !== null && key in obj && obj[key] === value;
};
export var isObjAndIncludes = function (obj, key, value) {
    return typeof obj === 'object' && obj !== null && key in obj && obj[key].includes(value);
};
export function debounce(cb, wait) {
    if (wait === void 0) { wait = 20; }
    var h;
    var callable = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        clearTimeout(h);
        h = window.setTimeout(function () { return cb.apply(void 0, args); }, wait);
    };
    return callable;
}
