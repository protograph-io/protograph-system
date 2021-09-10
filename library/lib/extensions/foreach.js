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
import { ProtoGraphLoaderNamespace } from "../config";
var KEYWORD = "query_foreach";
function replaceVarSQL(varName, eleId, expression) {
    if (typeof expression !== "object")
        return expression;
    if ("type" in expression && expression.type === "subquery") {
        expression.data = expression.data.map(function (item) { return replaceVarSQL(varName, eleId, item); });
        return expression;
    }
    else if (!("type" in expression)) {
        if (typeof expression.right === "string") {
            expression.right = expression.right.replaceAll((typeof eleId !== "string") ? "\"" + varName + "\"" : varName, eleId);
        }
        return expression;
    }
    return expression;
}
function replaceVar(varName, eleId, expression) {
    if (typeof expression !== 'object')
        return expression;
    if (expression.type === "query" && expression.keyword === "node") {
        expression.parameters = expression.parameters.map(function (nodeName) { return nodeName === varName ? eleId : nodeName; });
        return expression;
    }
    else if (expression.type === "query" && (expression.keyword === "sql_select_nodes" || expression.keyword === "sql_select_edges")) {
        expression.named_parameters["conditions"] = expression.named_parameters["conditions"].map(function (con) { return replaceVarSQL(varName, eleId, con); });
        return expression;
    }
    if ("parameters" in expression) {
        expression.parameters = expression.parameters.map(function (p) { return replaceVar(varName, eleId, p); });
    }
    if ("named_parameters" in expression && expression.named_parameters) {
        for (var k in Object.keys(expression.named_parameters)) {
            expression.named_parameters[k] = replaceVar(varName, eleId, expression.named_parameters[k]);
        }
    }
    return expression;
}
function foreachReplace(expressions, varName, indexName, newVal, index, res, line) {
    expressions.forEach(function (expression) {
        var _a;
        var jstring2 = JSON.stringify(expression);
        var newExpr = replaceVar(varName, newVal, JSON.parse(jstring2));
        newExpr = replaceVar(indexName, index, newExpr);
        var properties = __assign({}, (((_a = expression) === null || _a === void 0 ? void 0 : _a.properties) || (line === null || line === void 0 ? void 0 : line.properties) || {}));
        Object.keys(properties).forEach(function (key) {
            if (properties && typeof properties[key] === "string") {
                if (typeof newVal !== "string") {
                    if (properties[key].includes("\"")) {
                        properties[key] = properties[key].replaceAll("\"" + varName + "\"", newVal);
                    }
                    else {
                        properties[key] = properties[key].replaceAll(varName, newVal);
                    }
                }
                else {
                    properties[key] = properties[key].replaceAll(varName, newVal);
                }
                if (newVal.toString() === properties[key])
                    properties[key] = newVal;
                if (typeof index !== "string") {
                    if (typeof properties[key] === "string" && properties[key].includes("\"")) {
                        properties[key] = properties[key].replaceAll("\"" + indexName + "\"", index);
                    }
                    else if (typeof properties[key] === "string") {
                        properties[key] = properties[key].replaceAll(indexName, index);
                    }
                }
                else if (typeof properties[key] === "string") {
                    properties[key] = properties[key].replaceAll(indexName, index);
                }
                if (typeof properties[key] === varName)
                    properties[key] = index;
                if (typeof properties[key] === "string" && index.toString() === properties[key])
                    properties[key] = index;
            }
        });
        newExpr.properties = properties;
        res.push(newExpr);
    });
}
function foreachInner(parameters, core, line) {
    var _a = parameters, indexName = _a[0], varName = _a[1], iter = _a[2], expressionUnTyped = _a[3].data.data.expression;
    var jstring = JSON.stringify(expressionUnTyped);
    var expression = JSON.parse(jstring);
    var expressions = [];
    if (expression && typeof expression === 'object' && expression.keyword === KEYWORD) {
        var evaluatedQuery = core.evaluate(expression.parameters[2]);
        expression.parameters[2] = evaluatedQuery;
        var evaluatedQuery2 = core.evaluate(expression.parameters[3]);
        expression.parameters[3] = evaluatedQuery2;
        expressions = foreachInner(expression.parameters, core, line);
    }
    else {
        expressions = [expression];
    }
    var res = [];
    if (iter.data.keyword === "query") {
        var query = core.evaluate(iter.data.data).collection;
        query.forEach(function (ele, index) {
            foreachReplace(expressions, varName, indexName, ele.id(), index, res, line);
        });
    }
    else if (iter.data.keyword === "range") {
        var _b = iter.data.data, end = _b.end, start = _b.start, step = _b.step;
        var i = 0;
        start = start || 0;
        step = step || 1;
        for (var val = start; val < end; val += step) {
            foreachReplace(expressions, varName, indexName, val, i, res, line);
            i += 1;
        }
    }
    else if (iter.data.keyword === "array") {
        iter.data.data.forEach(function (item, index) {
            foreachReplace(expressions, varName, indexName, item, index, res, line);
        });
    }
    return res;
}
function init(core) {
    var union = function (_a) {
        var core = _a.core, parser = _a.parser, parameters = _a.parameters, namedParameters = _a.namedParameters, properties = _a.properties, line = _a.line;
        if (!core.cy)
            throw Error("Cytoscape not initialized");
        var exprs = foreachInner(parameters, core, line);
        var res = exprs.map(function (newExpr) {
            return core.evaluate(newExpr);
        });
        var collection = res.reduce(function (agg, item) {
            if (typeof item !== 'object' || !("collection" in item) || !item.collection)
                return agg;
            return agg.union(item.collection);
        }, core.cy.collection());
        line && line.properties && Object.keys(line.properties).forEach(function (key) { return delete line.properties[key]; });
        var objects = [];
        return {
            type: "query_result",
            keyword: line.keyword,
            query_object: __spreadArray([], Array.from(new Set(objects))),
            data: collection,
            collection: collection || core.cy.collection()
        };
    };
    core.defineHandler('query', KEYWORD, union);
}
function defineGrammar(grammarBuilder) {
    var expression = "(\"foreach\"i/\"for each\"i/\"for\"i) sp+ index:(i:anyword sp* \",\" sp* {return i})? v:anyword sp+ \"in\"i sp+ \n        q:( q:array { return {type: \"plain\", keyword:\"array\",data:q} }\n            /  q:range { return {type: \"plain\", keyword:\"range\",data:q} }\n            /   q:query { return {type: \"plain\", keyword:\"query\",data:q} }\n                )\n        sp* (\":\" sp*) sp* e:statement sp* \n        {return {type: \"query\", keyword: \"" + KEYWORD + "\", parameters: [index, v, q, {type:'plain', data:{expression: e}}]}}";
    grammarBuilder.defineGrammarQuery("nodes_and_edges", KEYWORD, "Query: For node in all nodes ([command / query / object])", expression);
}
var loader = window[ProtoGraphLoaderNamespace];
var declaration = { name: KEYWORD, exec: init, grammar: defineGrammar };
loader.register(declaration);
export default declaration;
