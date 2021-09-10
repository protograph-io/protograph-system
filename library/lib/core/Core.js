var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
import "./default_extensions";
import loader from './ExtensionLoader';
import { isObjAndHas, logEvaluation } from './helpers';
import { Router } from "./Router";
import { StylePropertiesHandler } from './StyleProperties';
export var defaultStyles = [{
        selector: "node",
        style: {
            "background-color": "lightgray",
            "transition-property": "background-color",
            "text-valign": "center"
        }
    }, {
        selector: "$node node",
        style: {
            "background-color": "white",
            "border-color": "black",
            "transition-property": "background-color, border-color",
            "border-width": 2,
        }
    }, {
        selector: "edge",
        style: {
            "line-color": "lightgray",
            "curve-style": "bezier",
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
var OrderedComplete = (function () {
    function OrderedComplete(limit) {
        if (limit === void 0) { limit = undefined; }
        this.limit = limit;
        this.callbacks = [];
        this.count = 0;
    }
    OrderedComplete.prototype.add = function (f) {
        this.callbacks.push(f);
    };
    OrderedComplete.prototype.markReady = function () {
        this.count += 1;
    };
    OrderedComplete.prototype.isComplete = function () {
        var criteria = this.callbacks.length;
        if (this.limit !== undefined && this.limit !== null)
            criteria = this.limit;
        return this.count === criteria;
    };
    OrderedComplete.prototype.tryComplete = function () {
        this.isComplete() && this.complete();
    };
    OrderedComplete.prototype.complete = function () {
        this.callbacks.forEach(function (f, i) { return window.setTimeout(function () { return f(); }, i * 0); });
        this.callbacks.length = 0;
        this.count = 0;
    };
    return OrderedComplete;
}());
export { OrderedComplete };
function setPositions(props, eles) {
    if (!props)
        return;
    if (!("parent" in props))
        return;
    var nodes = eles.filter("node");
    if (!nodes.empty())
        nodes.move({ parent: props.parent.toString() });
}
function setParent(props, eles) {
    if (!props)
        return;
    var position = __assign(__assign({}, (("x" in props) ? { x: Number(props.x) } : {})), (("y" in props) ? { y: Number(props.y) } : {}));
    var nodes = eles.filter("node");
    if (!nodes.empty())
        nodes.positions(position);
}
var Core = (function () {
    function Core(cy, parser, config, includeWindowExtensions) {
        var _this = this;
        if (cy === void 0) { cy = undefined; }
        if (config === void 0) { config = {}; }
        if (includeWindowExtensions === void 0) { includeWindowExtensions = null; }
        var _a;
        this.cy = cy;
        this.parser = parser;
        this.routers = {
            command: new Router(),
            object: new Router(),
            query: new Router(),
        };
        this.stylePropertiesHandler = new StylePropertiesHandler();
        this.config = {
            animate_duration: 500
        };
        this.utilitySet = new Router();
        this.handlers = {
            plain: function (line, carryOverProperties) {
                return {
                    type: "plain",
                    keyword: null,
                    data: line,
                    extra: {}
                };
            },
            command: function (line, carryOverProperties) {
                var handler = _this.routers.command.get(line.keyword);
                if (!handler)
                    return;
                var evaluatedParameters = _this.parseParameters(line.parameters);
                var evaluatedNamedParameters = _this.parseNamedParameters(line.named_parameters);
                var extraProperties = __spreadArray(__spreadArray([], evaluatedParameters), Object.values(evaluatedNamedParameters)).reduce(function (agg, res) {
                    return __assign(__assign({}, agg), ((typeof res === 'object' && res !== null && res.extraCollectionProperties) || {}));
                }, {});
                var res = handler({
                    core: _this,
                    parser: _this.parser,
                    parameters: evaluatedParameters,
                    namedParameters: evaluatedNamedParameters,
                    properties: __assign(__assign({}, carryOverProperties), (line.properties || {})),
                    line: line
                });
                if (typeof res === 'object' && res !== null) {
                    res.extraCollectionProperties = __assign(__assign({}, extraProperties), (res.extraCollectionProperties || {}));
                }
                return res;
            },
            object: function (line, carryOverProperties) {
                if (carryOverProperties === void 0) { carryOverProperties = {}; }
                var objectHander = _this.routers.object.get(line.keyword);
                if (!objectHander)
                    throw Error("Unsupported Object");
                var lineProperties = ("properties" in line && line.properties) ? line.properties : {};
                var properties = __assign(__assign({}, (carryOverProperties || {})), lineProperties);
                var evaluatedParameters = _this.parseParameters(line.parameters, properties);
                var evaluatedNamedParameters = _this.parseNamedParameters(line.named_parameters, properties);
                var extraProperties = __spreadArray(__spreadArray([], evaluatedParameters), Object.values(evaluatedNamedParameters)).reduce(function (agg, res) {
                    return __assign(__assign({}, agg), ((typeof res === 'object' && res !== null && res.extraCollectionProperties) || {}));
                }, {});
                var res = objectHander.execute({
                    core: _this,
                    parser: _this.parser,
                    line: line,
                    parameters: evaluatedParameters,
                    namedParameters: evaluatedNamedParameters,
                    properties: __assign(__assign({}, carryOverProperties), line.properties)
                });
                if (typeof res === 'object' && res !== null) {
                    res.extraCollectionProperties = __assign(__assign({}, extraProperties), (res.extraCollectionProperties || {}));
                }
                return res;
            },
            query: function (line, carryOverProperties) {
                logEvaluation("Beginning query", line);
                var handler = _this.routers.query.get(line.keyword);
                if (!handler) {
                    console.log("Tried ", line.keyword, " Only have ", Array.from(_this.routers.query.entries()).map(function (_a) {
                        var n = _a[0];
                        return n;
                    }));
                    throw Error("Query Handler Doesn't Exist");
                }
                var lineProperties = ("properties" in line && line.properties) ? line.properties : {};
                var properties = __assign(__assign({}, (carryOverProperties || {})), lineProperties);
                var evaluatedParameters = _this.parseParameters(line.parameters, properties);
                var evaluatedNamedParameters = _this.parseNamedParameters(line.named_parameters, properties);
                var extraProperties = __spreadArray(__spreadArray([], evaluatedParameters), Object.values(evaluatedNamedParameters)).reduce(function (agg, res) {
                    return __assign(__assign({}, agg), ((typeof res === 'object' && res !== null && res.extraCollectionProperties) || {}));
                }, {});
                var res = handler({
                    core: _this,
                    parser: _this.parser,
                    parameters: evaluatedParameters,
                    namedParameters: evaluatedNamedParameters,
                    properties: properties,
                    line: line,
                });
                if (typeof res === 'object' && res !== null) {
                    res.extraCollectionProperties = __assign(__assign({}, extraProperties), (res.extraCollectionProperties || {}));
                }
                return res;
            }
        };
        this.config = __assign(__assign({}, this.config), config);
        (_a = this.cy) === null || _a === void 0 ? void 0 : _a.style(defaultStyles);
        var extensionsToLoad = Array.from(loader.entries());
        if (Array.isArray(includeWindowExtensions)) {
            extensionsToLoad = extensionsToLoad.filter(function (_a) {
                var name = _a[0], f = _a[1];
                return includeWindowExtensions.includes(name);
            });
        }
        for (var _i = 0, extensionsToLoad_1 = extensionsToLoad; _i < extensionsToLoad_1.length; _i++) {
            var _b = extensionsToLoad_1[_i], extensionExec = _b[1];
            extensionExec.exec(this);
        }
    }
    Core.prototype.defineHandler = function (type, keyword, handler) {
        this.routers[type].load(keyword, handler);
    };
    Core.prototype.defineUtility = function (keyword, util) {
        this.utilitySet.loadAssertUnique(keyword, util);
    };
    Core.prototype.getUtility = function (keyword) {
        return this.utilitySet.get(keyword);
    };
    Core.prototype.getObject = function (keyword) {
        return this.routers.object.get(keyword);
    };
    Core.prototype.evaluate = function (line, carryOverProperties, isRootCall, animate, orderedComplete) {
        var _a, _b, _c;
        if (isRootCall === void 0) { isRootCall = false; }
        if (animate === void 0) { animate = true; }
        line = JSON.parse(JSON.stringify(line));
        var _originalAnimationDuration = this.config.animate_duration;
        if (!animate)
            this.config.animate_duration = 0;
        logEvaluation("evaluated type start");
        var evaluateResult;
        if (isObjAndHas(line, "type")) {
            var handler = this.handlers[line.type];
            var res_1;
            try {
                res_1 = handler(line, carryOverProperties);
            }
            catch (e) {
                if (typeof line === 'object' && line !== null && "returnAutoComplete" in line && line.type !== "plain") {
                    var objectHander = this.routers.object.get(line.keyword);
                    if (objectHander === null || objectHander === void 0 ? void 0 : objectHander.propertiesAutoComplete) {
                        this.cm && ((_a = this.autoCompleteBuilder) === null || _a === void 0 ? void 0 : _a.showPropertiesHint(this.cm, objectHander.propertiesAutoComplete(), line.type, this.stylePropertiesHandler));
                    }
                }
                throw e;
            }
            logEvaluation("evaluated type line", res_1);
            if (typeof line === 'object' && line !== null
                && "returnAutoComplete" in line
                && res_1
                && typeof res_1 === 'object' && res_1 !== null
                && "propertiesAutoComplete" in res_1 && res_1.propertiesAutoComplete
                && line.type !== "plain") {
                this.cm && ((_b = this.autoCompleteBuilder) === null || _b === void 0 ? void 0 : _b.showPropertiesHint(this.cm, res_1.propertiesAutoComplete(), line.type, this.stylePropertiesHandler));
            }
            else if (typeof line === 'object' && line !== null
                && "returnAutoComplete" in line
                && line.type !== "plain") {
                this.cm && ((_c = this.autoCompleteBuilder) === null || _c === void 0 ? void 0 : _c.showPropertiesHint(this.cm, [], line.type, this.stylePropertiesHandler));
            }
            if (line.properties && res_1 && res_1.collection && !res_1.collection.empty()) {
                var props_1 = line.properties || {};
                props_1 = __assign(__assign({}, ((typeof res_1 === 'object' && res_1 !== null && res_1.extraCollectionProperties) || {})), props_1);
                var validStyleProps_1 = this.stylePropertiesHandler.filterAndParse(props_1);
                var dataProps = Object.fromEntries(Object.entries(props_1).map(function (_a) {
                    var k = _a[0], val = _a[1];
                    return [k, (val && typeof val !== 'number') ? val.toString() : val];
                }));
                res_1.collection.data(dataProps);
                if (animate && this.config.animate_duration) {
                    if (orderedComplete === undefined)
                        orderedComplete = new OrderedComplete(1);
                    orderedComplete.add(function () {
                        res_1.collection.style(validStyleProps_1);
                        line && props_1 && setPositions(props_1, res_1.collection);
                        line && props_1 && setParent(props_1, res_1.collection);
                    });
                    res_1.collection.animate(__assign({ style: __assign({}, validStyleProps_1) }, ((!res_1.collection.filter("node").empty() && line && props_1 && (("x" in props_1) || ("y" in props_1))) ? {
                        position: __assign(__assign({}, (("x" in props_1) ? { x: Number(props_1.x) } : {})), (("y" in props_1) ? { y: Number(props_1.y) } : {}))
                    } : {})), {
                        duration: this.config.animate_duration,
                        queue: false,
                        complete: function () {
                            orderedComplete === null || orderedComplete === void 0 ? void 0 : orderedComplete.markReady();
                            orderedComplete === null || orderedComplete === void 0 ? void 0 : orderedComplete.tryComplete();
                        }
                    });
                }
                else {
                    res_1.collection.style(validStyleProps_1);
                    line && props_1 && setPositions(props_1, res_1.collection);
                }
            }
            evaluateResult = res_1;
        }
        else {
            logEvaluation("evaluated type plain", line);
            evaluateResult = line;
        }
        if (!animate)
            this.config.animate_duration = _originalAnimationDuration;
        return evaluateResult;
    };
    Core.prototype.update = function () {
        var _a, _b;
        (_a = this.cy) === null || _a === void 0 ? void 0 : _a.elements().forEach(function (ele) {
            if ("x" in ele.data() || "y" in ele.data())
                ele.lock();
        });
        this.routers.object.forEach(function (handler) {
            handler.onChange();
        });
        this.utilitySet.forEach(function (handler) {
            handler && handler.onChange && handler.onChange();
        });
        (_b = this.cy) === null || _b === void 0 ? void 0 : _b.elements().forEach(function (ele) {
            if ("x" in ele.data() || "y" in ele.data())
                ele.unlock();
        });
    };
    Core.prototype.reset = function () {
        this.routers.object.forEach(function (handler) {
            handler && handler.reset && handler.reset();
        });
        this.utilitySet.forEach(function (handler) {
            handler && handler.reset && handler.reset();
        });
    };
    Core.prototype.parseParameters = function (parameters, properties) {
        var _this = this;
        if (parameters === void 0) { parameters = []; }
        return parameters.map(function (p) { return _this.evaluate(p, properties); });
    };
    Core.prototype.parseNamedParameters = function (parameters, properties) {
        var _this = this;
        if (parameters === void 0) { parameters = {}; }
        return Object.fromEntries(Object.entries(parameters || {}).map(function (_a) {
            var k = _a[0], v = _a[1];
            return [k, _this.evaluate(v, properties)];
        }));
    };
    return Core;
}());
export { Core };
