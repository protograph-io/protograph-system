import { ProtoGraphLoaderNamespace } from "../config";
function init(core) {
    core.defineHandler('query', "sql_select_nodes", generateHandler("nodes"));
    core.defineHandler('query', "sql_select_edges", generateHandler("edges"));
    core.defineHandler('query', "sql_select_nodes_query", generateHandler("query"));
    core.defineHandler('query', "sql_select_edges_query", generateHandler("query"));
}
function defineGrammar(grammarBuilder) {
    var expressionGenerator = function (object, parenthesesOptional) {
        if (parenthesesOptional === void 0) { parenthesesOptional = false; }
        return ("\"(\"\n    _ Query_SQL_Select__SelectToken?\n    _ \"" + object + "\"i _\n    _ where:Query_SQL_Select__WhereExpr?\n    \")\"\n   {\n    return {\n      type: \"query\",\n      keyword: \"sql_select_" + object + "\",\n      named_parameters: where || { conditions: [] }\n    };\n  }\n   ").replaceAll(PREFIX_PLACEHOLDER, SAFE_PREFIX);
    };
    var expressionGeneratorQuery = function (object, parenthesesOptional) {
        if (parenthesesOptional === void 0) { parenthesesOptional = false; }
        return ("\"(\"\n   _ Query_SQL_Select__SelectToken?\n   _ q:query_object_" + object + " _\n   _ where:Query_SQL_Select__WhereExpr?\n   \")\"\n  {\n   return {\n     type: \"query\",\n     keyword: \"sql_select_" + object + "_query\",\n     named_parameters: {...(where || {conditions: []}), baseQuery:q }\n   };\n }\n  ").replaceAll(PREFIX_PLACEHOLDER, SAFE_PREFIX);
    };
    grammarBuilder.defineGrammarFragment(baseGrammar);
    grammarBuilder.defineGrammarQuery("nodes", "sql_select_query_nodes", "Query: SQL Nodes Select", expressionGeneratorQuery("nodes"));
    grammarBuilder.defineGrammarQuery("edges", "sql_select_query_edges", "Query: SQL Edges Select", expressionGeneratorQuery("edges"));
    grammarBuilder.defineGrammarQuery("nodes", "sql_select_nodes", "Query: SQL Nodes Select", expressionGenerator("nodes"));
    grammarBuilder.defineGrammarQuery("edges", "sql_select_edges", "Query: SQL Edges Select", expressionGenerator("edges"));
    var commandExp = "Query_SQL_Select__SelectToken _ d:(" + expressionGenerator("nodes") + "/" + expressionGenerator("edges") + "/" + expressionGeneratorQuery("edges") + "/" + expressionGeneratorQuery("nodes") + ") {return d}";
    grammarBuilder.defineGrammarCommand("select", "Select Command", commandExp);
}
var loader = window[ProtoGraphLoaderNamespace];
var declaration = { name: "query_sql_select", exec: init, grammar: defineGrammar };
loader.register(declaration);
var PREFIX_PLACEHOLDER = "Query_SQL_Select_";
var SAFE_PREFIX = "Query_SQL_Select_";
var baseGrammar = "\n\n/* Tokens */\n\nQuery_SQL_Select__SelectToken\n  = \"SELECT\"i _\n\nQuery_SQL_Select__SeparatorToken\n  = \",\"\n\nQuery_SQL_Select__FromToken\n  = \"FROM\"i _\n\nQuery_SQL_Select__WhereToken\n  = \"WHERE\"i _\n\nQuery_SQL_Select__LikeToken\n  = \"LIKE\"i _\n\nQuery_SQL_Select__OrToken\n  = \"OR\"i _\n\nQuery_SQL_Select__AndToken\n  = \"AND\"i _\n\n/* Identifier */\n\nQuery_SQL_Select__Identifier \"identifier\"\n  = anyword\n\nQuery_SQL_Select__SelectField \"select valid field\"\n  = Query_SQL_Select__Identifier\n  / \"*\"\n\nQuery_SQL_Select__SelectFieldRest\n  = _ Query_SQL_Select__SeparatorToken _ s:Query_SQL_Select__SelectField {\n    return s;\n  }\n\nQuery_SQL_Select__WhereExpr \"where expression\"\n  = Query_SQL_Select__WhereToken x:Query_SQL_Select__LogicExpr xs:Query_SQL_Select__LogicExprRest* {\n    return {\n      conditions: [x].concat(xs).flat(1)\n    };\n  }\n\nQuery_SQL_Select__LogicExpr\n  = _ \"(\" _ x:Query_SQL_Select__LogicExpr xs:Query_SQL_Select__LogicExprRest* _ \")\" _ {\n    return {\ntype: \"subquery\",\ndata: [x].concat(xs).flat(1)\n};\n  }\n  / _ left:Query_SQL_Select__Expr _ op:Query_SQL_Select__Operator _ right:Query_SQL_Select__Expr_Quoted _ {\n    return {\n      left: left,\n      op: op,\n      right: right\n    };\n  }\n\nQuery_SQL_Select__LogicExprRest\n  = _ j:Query_SQL_Select__Joiner _ l:Query_SQL_Select__LogicExpr {\n  return [j,l]\n    return {\n      joiner: j,\n      expression: l\n    };\n  }\n\nQuery_SQL_Select__Joiner \"joiner\"\n  = Query_SQL_Select__OrToken  { return \"Or\";  }\n  / Query_SQL_Select__AndToken { return \"And\"; }\n\nQuery_SQL_Select__Operator = \n    p1:\"@\" p2: Query_SQL_Select__Operator_Inner {return \"@\" + p2}\n  / p1:\"!\" p2:Query_SQL_Select__Operator_Inner {return \"!\" + p2}\n  / p1:\"not\" _ p2:Query_SQL_Select__Operator_Inner {return \"!\" + p2}\n  / Query_SQL_Select__Operator_Inner\n\nQuery_SQL_Select__Operator_Inner\n  = \"<>\"       { return \"!=\" ; }\n  / \"==\"       { return \"=\"  ; }\n  / \"=\"        { return \"=\"  ; }\n  / \"!=\"       { return \"!=\" ; }\n  / \">=\"       { return \">=\" ; }\n  / \">\"        { return \">\"  ; }\n  / \"<=\"       { return \"<=\" ; }\n  / \"<\"        { return \"<\"  ; }\n  / \"^=\"       { return \"^=\" ; }\n  / \"$=\"       { return \"$=\" ; }\n  / \"is\" _ \"like\"   { return \"*=\"  ; }\n  / \"has\"   { return \"*=\"  ; }\n  / \"includes\"   { return \"*=\"  ; }\n  / \"contains\"   { return \"*=\"  ; }\n  / \"is\" _ \"not\"   { return \"!=\"  ; }\n  / \"is\"       { return \"=\"  ; }\n  / \"not\"      { return \"!=\"  ; }\n / Query_SQL_Select__LikeToken  { return \"Like\";      }\n\n/* Expressions */\n\nQuery_SQL_Select__Expr\n  = Float\n  / Integer\n  / s:Query_SQL_Select__Identifier \n  / s:String\n\nQuery_SQL_Select__Expr_Quoted\n  = Float\n  / Integer\n  / v:dynamic_single_value { return (typeof value !== 'number') ? '\"' + v + '\"' : v} /* Cytoscape requires strings to be quoted */\n  / s:Query_SQL_Select__Identifier {return '\"' + s + '\"' } /* Cytoscape requires strings to be quoted */\n  / s:String {return '\"' + s + '\"' } /* Cytoscape requires strings to be quoted */\n\n\n".replaceAll(PREFIX_PLACEHOLDER, SAFE_PREFIX);
function booleanPrecedentInner() {
    return {
        operation: "and",
        clauses: []
    };
}
function booleanPrecedent(conditions) {
    var inner = [];
    var latestClause = booleanPrecedentInner();
    conditions.forEach(function (clause) {
        if (typeof clause === 'object' && clause !== null && "type" in clause && clause.type === "subquery") {
            latestClause.clauses.push(booleanPrecedent(clause.data));
        }
        else if (clause.toString().toLowerCase() === "and") {
        }
        else if (clause.toString().toLowerCase() === "or") {
            inner.push(latestClause);
            latestClause = booleanPrecedentInner();
        }
        else {
            latestClause.clauses.push(clause);
        }
    });
    inner.push(latestClause);
    return {
        operation: "or",
        clauses: inner
    };
}
function likeSelector(con, ele) {
    var left = ele.style(con.left) || ele.data(con.left);
    var right = con.right.toString().replaceAll('"', "");
    right = right.toString().replace(new RegExp("([\\.\\\\\\+\\*\\?\\[\\^\\]\\$\\(\\)\\{\\}\\=\\!\\<\\>\\|\\:\\-])", "g"), "\\$1");
    right = right.replace(/%/g, '.*').replace(/_/g, '.');
    return RegExp('^' + right + '$', 'gi').test(left);
}
function generateSelector(con, startingSet, core) {
    if ("op" in con) {
        var selector = "[" + con.left + " " + con.op + " " + con.right + "]";
        if (con.op === "Like") {
            selector = function (ele) { return likeSelector(con, ele); };
        }
        if (["degree", "indegree", "outdegre"].includes(con.left))
            selector = "[[" + con.left + " " + con.op + " " + con.right + "]]";
        var res = (selector) ? startingSet.filter(selector) : startingSet.filter(Boolean);
        return res;
    }
    else if (typeof con === 'object' && con !== null && "operation" in con && con.operation === 'and') {
        var fullSet = undefined;
        for (var _i = 0, _a = con.clauses; _i < _a.length; _i++) {
            var c = _a[_i];
            var cRes = generateSelector(c, core, core);
            if (fullSet === undefined)
                fullSet = cRes;
            else
                fullSet = fullSet.intersect(cRes);
        }
        if (fullSet === undefined)
            throw Error("Should have at least one entry");
        return fullSet;
    }
    else if (typeof con === 'object' && con !== null && "operation" in con && con.operation === 'or') {
        return con.clauses.reduce(function (agg, c) {
            return agg.union(generateSelector(c, agg, core));
        }, core.collection());
    }
    else {
        console.log("SQL SELECT PLUGIN: Invalid con", con);
        throw Error('Non-exhaustive sql handler');
    }
}
function generateHandler(object) {
    var objectToCytoscapeGroup = {
        "nodes": function (col, _namedParameters) { return col.filter("node"); },
        "edges": function (col, _namedParameters) { return col.filter("edge"); },
        "query": function (col, namedParameters) { return col.intersection(namedParameters.baseQuery.collection); },
    };
    return function (_a) {
        var core = _a.core, parameters = _a.parameters, namedParameters = _a.namedParameters, properties = _a.properties, line = _a.line;
        if (!core.cy)
            throw Error("Core Cytoscape not initialized");
        var cy = core.cy;
        var conditions = namedParameters.conditions;
        var elements;
        if (conditions.length) {
            var prec = booleanPrecedent(conditions);
            elements = generateSelector(prec, cy, cy);
        }
        else {
            elements = cy;
        }
        elements = objectToCytoscapeGroup[object](elements, namedParameters);
        return {
            type: "query_result",
            keyword: line.keyword,
            query_object: [object],
            data: elements,
            collection: elements
        };
    };
}
export default declaration;
