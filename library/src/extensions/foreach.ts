import cytoscape from "cytoscape";
import { ProtoGraphLoaderNamespace } from "../config";
import { Core } from "../core/Core";
import { ExtensionDeclaration } from "../core/ExtensionLoader";
import { GrammarBuilder } from "../core/Parser";
import { QueryHandler } from "../core/types";
import { Grammar } from "../grammar/grammar.types";
import { SqlConditions } from "./sql";

// TODO: Refactor for performance

const KEYWORD = "query_foreach";

function replaceVarSQL(varName: string, eleId: string, expression: SqlConditions[number]): SqlConditions[number] {
    if (typeof expression !== "object") return expression; // first base case
    if ("type" in expression && expression.type === "subquery") {
        // recursive case
        expression.data = expression.data.map(item => replaceVarSQL(varName, eleId, item));
        return expression;
    } else if (!("type" in expression)) {
        // Second base case
        // For now only support values
        if (typeof expression.right === "string") {
            // console.log("FOREACH original here", expression.right, eleId)
            expression.right = expression.right.replaceAll((typeof eleId !== "string") ? `"${varName}"` : varName, eleId);
        }
        return expression;
    }
    return expression;
}

function replaceVar(varName: string, eleId: string, expression: Grammar.PEGjsRuleReturnValue): Grammar.PEGjsRuleReturnValue {
    // console.log("FOREACH reaplacing", varName, " with ", eleId)
    if (typeof expression !== 'object') return expression;
    // Base Case
    if (expression.type === "query" && expression.keyword === "node") {
        // If name matches var then replace otherwise keep
        // console.log("FOREACH REPLACED", expression.parameters, expression.parameters.map(nodeName => nodeName === varName ? eleId : nodeName))
        expression.parameters = expression.parameters.map(nodeName => nodeName === varName ? eleId : nodeName);
        return expression;
    } else if (expression.type === "query" && (expression.keyword === "sql_select_nodes" || expression.keyword === "sql_select_edges")) {
        // If name matches var then replace otherwise keep
        // @ts-ignore
        expression.named_parameters["conditions"] = expression.named_parameters["conditions"].map((con) => replaceVarSQL(varName, eleId, con as SqlConditions));
        return expression;
    }
    // Recursive Case
    if ("parameters" in expression) {
        expression.parameters = expression.parameters.map(p => replaceVar(varName, eleId, p as Grammar.PEGjsRuleReturnValue)) as Grammar.Parameters
    }
    if ("named_parameters" in expression && expression.named_parameters) {
        for (let k in Object.keys(expression.named_parameters)) {
            expression.named_parameters[k] = replaceVar(varName, eleId, expression.named_parameters[k] as Grammar.PEGjsRuleReturnValue) as Grammar.NamedParameters[string]
        }
    }
    return expression;
}


function foreachReplace(expressions: Grammar.PEGjsRuleReturnValue[], varName: string, indexName: string, newVal: string, index: any, res: Grammar.PEGjsRuleReturnValue[], line: Grammar.Line) {
    // Must deep clone;
    // console.log("FOREACH NOW LOOPING, expression", expressions)
    expressions.forEach(expression => {
        const jstring2 = JSON.stringify(expression);
        // console.log("FOREACH jstring2", jstring2)
        let newExpr = replaceVar(varName, newVal, JSON.parse(jstring2));
        newExpr = replaceVar(indexName, index, newExpr);
        // console.log(newVal, "FOREACH new expression", newExpr);

        const properties = { ...((expression as Grammar.Line)?.properties || line?.properties || {}) }
        // Modify properties before applied
        Object.keys(properties).forEach((key) => {
            if (properties && typeof properties[key] === "string") {
                if (typeof newVal !== "string") {
                    if (properties[key].includes(`"`)) {
                        properties[key] = properties[key].replaceAll(`"${varName}"`, newVal);
                    } else {
                        properties[key] = properties[key].replaceAll(varName, newVal);
                    }
                }
                else {
                    properties[key] = properties[key].replaceAll(varName, newVal);
                }
                // if replaced is string of newVal, set to newVal (only has effect when newVal is not string)
                if (newVal.toString() === properties[key]) properties[key] = newVal;
                // console.log("FOREACH SETTING PROP", key, newVal, properties[key])
                //
                // Index
                //
                if (typeof index !== "string") {
                    if (typeof properties[key] === "string" && properties[key].includes(`"`)) {
                        properties[key] = properties[key].replaceAll(`"${indexName}"`, index);
                    } else if (typeof properties[key] === "string") {
                        properties[key] = properties[key].replaceAll(indexName, index);
                    }
                }
                else if (typeof properties[key] === "string") {
                    properties[key] = properties[key].replaceAll(indexName, index);
                }
                // if replaced is string of newVal, set to newVal (only has effect when newVal is not string)
                if (typeof properties[key] === varName) properties[key] = index;
                if (typeof properties[key] === "string" && index.toString() === properties[key]) properties[key] = index;
                // console.log("FOREACH SETTING PROP", key, newVal, properties[key])
            }
        })
        // @ts-ignore
        newExpr.properties = properties;

        res.push(newExpr);
    });


}

// Careful line is mutable and shared between everyting
function foreachInner(parameters: Grammar.PEGjsRuleReturnValue["parameters"], core: Core, line: Grammar.Line): Grammar.PEGjsRuleReturnValue[] {
    // console.log("FOREACH INNER recieved", parameters);
    const [indexName, varName, iter, { data: { data: { expression: expressionUnTyped } } }] = parameters as any;
    // console.log("FOREACH paras", parameters, varName, query, expression);
    const jstring = JSON.stringify(expressionUnTyped);
    // console.log("FOREACH jstring", jstring, expressionUnTyped, parameters.data.data)
    const expression = JSON.parse(jstring) as Grammar.PEGjsRuleReturnValue;
    let expressions: Grammar.PEGjsRuleReturnValue[] = [];
    if (expression && typeof expression === 'object' && expression.keyword === KEYWORD) {
        let evaluatedQuery = core.evaluate(expression.parameters[2]);
        expression.parameters[2] = evaluatedQuery as any;
        let evaluatedQuery2 = core.evaluate(expression.parameters[3]);
        expression.parameters[3] = evaluatedQuery2 as any;
        // console.log("FOREACH RECURSING ON", expression)
        expressions = foreachInner(expression.parameters, core, line);
    } else {
        expressions = [expression]
    }

    const res: Grammar.PEGjsRuleReturnValue[] = [];
    // console.log("FOREACH iter", iter)
    if (iter.data.keyword === "query") {
        // @ts-ignore
        const { collection: query } = core.evaluate(iter.data.data);
        // console.log("foreach operationg query", query);
        (query as cytoscape.Collection).forEach((ele, index) => {
            foreachReplace(expressions, varName, indexName, ele.id(), index, res, line);
        });
    } else if (iter.data.keyword === "range") {
        let { end, start, step } = iter.data.data;
        let i = 0
        start = start || 0;
        step = step || 1;
        // console.log("FOREACH range", end, start, step)
        for (let val = start; val < end; val += step) {
            // console.log("FOREACH range inner", val, i)
            foreachReplace(expressions, varName, indexName, val, i, res, line);
            i += 1;
        }
    } else if (iter.data.keyword === "array") {
        iter.data.data.forEach((item: any, index: number) => {
            foreachReplace(expressions, varName, indexName, item, index, res, line);
        });
    }
    return res;
}

// Extension logic
function init(core: InstanceType<typeof Core>) {
    const union: QueryHandler = ({ core, parser, parameters, namedParameters, properties, line }) => {
        if (!core.cy) throw Error("Cytoscape not initialized");
        const exprs = foreachInner(parameters as any, core, line);
        const res = exprs.map(newExpr => {
            // console.log("FOREACH EVALUATING", newExpr)
            return core.evaluate(newExpr as Grammar.Line)
        })

        const collection = res.reduce((agg: cytoscape.Collection, item) => {
            if (typeof item !== 'object' || !("collection" in item) || !item.collection) return agg;
            return agg.union(item.collection);
        }, core.cy.collection());
        // const collection = core.cy.collection();

        // console.log("FOREACHING");

        // Remove properties so that Core does not override it. Must maintain ref
        // @ts-ignore
        line && line.properties && Object.keys(line.properties).forEach(key => delete line.properties[key]);

        const objects: any[] = [];
        return {
            type: "query_result",
            keyword: line.keyword,
            query_object: [...Array.from(new Set(objects))],
            data: collection,
            // BUG: returning a collection for foreach causes it to break
            collection: collection || core.cy.collection()
        }
    }
    core.defineHandler('query', KEYWORD, union);
}
function defineGrammar(grammarBuilder: InstanceType<typeof GrammarBuilder>) {
    // unsure if `anyword` is the best choice
    const expression =
        `("foreach"i/"for each"i/"for"i) sp+ index:(i:anyword sp* "," sp* {return i})? v:anyword sp+ "in"i sp+ 
        q:( q:array { return {type: "plain", keyword:"array",data:q} }
            /  q:range { return {type: "plain", keyword:"range",data:q} }
            /   q:query { return {type: "plain", keyword:"query",data:q} }
                )
        sp* (":" sp*) sp* e:statement sp* 
        {return {type: "query", keyword: "${KEYWORD}", parameters: [index, v, q, {type:'plain', data:{expression: e}}]}}`;
    // const expression = `("foreach"i/"for each"i/"for"i) sp+ index:(i:anyword sp* "," sp* {return i})? v:anyword sp+ "in"i sp+ q:query sp+ (":" sp+)? "(" sp* e:statement sp* ")" {return {type: "query", keyword: "${KEYWORD}", parameters: [index, v, q, {type:'plain', data:{expression: e}}]}}`;
    grammarBuilder.defineGrammarQuery("nodes_and_edges", KEYWORD, "Query: For node in all nodes ([command / query / object])", expression);
    // grammarBuilder.defineGrammarQuery("nodes", KEYWORD, "Query: For node in all nodes ([command / query / object])", expression);
    // grammarBuilder.defineGrammarQuery("edges", KEYWORD, "Query: For node in all nodes ([command / query / object])", expression);
}

let loader = (window as { [key: string]: any })[ProtoGraphLoaderNamespace];
let declaration: ExtensionDeclaration = { name: KEYWORD, exec: init, grammar: defineGrammar };
loader.register(declaration);

export default declaration;