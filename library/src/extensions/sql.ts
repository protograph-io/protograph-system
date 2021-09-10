import cytoscape from "cytoscape";
import { ProtoGraphLoaderNamespace } from "../config";
import { Core } from "../core/Core";
import { ExtensionDeclaration } from "../core/ExtensionLoader";
import { GrammarBuilder } from "../core/Parser";
import { EvaluatedParameter, QueryHandler } from "../core/types"; 

// TODO:
// - Filter on source/target properties (e.g. select edges where source.group = 1)
// - Filter nodes based on arbitraty connections 
//    (e.g. all nodes connected to nodes with group = 1 
//      | select nodes where edges connected with (group = 1) <- can you filter on edge too?
//      | select nodes connected with (group = 1) <- can you filter on edge too?
//    )


/////////////////////////// Necessary For Any Extension ///////////////////////////

// The loader creates a store of all loaded/imported extensions.
// ... This does not install/define the extension for use in a core.
// The core.defineXXXXX is used to install the extension for a core instantiation.

// Layout extension declaration
function init(core: InstanceType<typeof Core>) {
  core.defineHandler('query', "sql_select_nodes", generateHandler("nodes"));
  core.defineHandler('query', "sql_select_edges", generateHandler("edges"));
  core.defineHandler('query', "sql_select_nodes_query", generateHandler("query"));
  core.defineHandler('query', "sql_select_edges_query", generateHandler("query"));
}
function defineGrammar(grammarBuilder: InstanceType<typeof GrammarBuilder>) {
  //     const raw = `
  //     PREFIX_PLACEHOLDER_SelectQuery
  //   = _ b:PREFIX_PLACEHOLDER_SelectToken
  //     _ PREFIX_PLACEHOLDER_SelectValueToken
  //     _ where:PREFIX_PLACEHOLDER_WhereExpr? {
  //     return {
  //       type: "query",
  //       keyword: "sql_select",
  //       named_parameters: where
  //     };
  //   }
  //   `;
  const expressionGenerator = (object: "nodes" | "edges", parenthesesOptional: boolean = false) => `"("
    _ Query_SQL_Select__SelectToken?
    _ "${object}"i _
    _ where:Query_SQL_Select__WhereExpr?
    ")"
   {
    return {
      type: "query",
      keyword: "sql_select_${object}",
      named_parameters: where || { conditions: [] }
    };
  }
   `.replaceAll(PREFIX_PLACEHOLDER, SAFE_PREFIX);
  const expressionGeneratorQuery = (object: "nodes" | "edges", parenthesesOptional: boolean = false) => `"("
   _ Query_SQL_Select__SelectToken?
   _ q:query_object_${object} _
   _ where:Query_SQL_Select__WhereExpr?
   ")"
  {
   return {
     type: "query",
     keyword: "sql_select_${object}_query",
     named_parameters: {...(where || {conditions: []}), baseQuery:q }
   };
 }
  `.replaceAll(PREFIX_PLACEHOLDER, SAFE_PREFIX);
  
  grammarBuilder.defineGrammarFragment(baseGrammar);
  grammarBuilder.defineGrammarQuery("nodes", "sql_select_query_nodes", "Query: SQL Nodes Select", expressionGeneratorQuery("nodes"));
  grammarBuilder.defineGrammarQuery("edges", "sql_select_query_edges", "Query: SQL Edges Select", expressionGeneratorQuery("edges"));

  // Must go after so it has higher precedence
  grammarBuilder.defineGrammarQuery("nodes", "sql_select_nodes", "Query: SQL Nodes Select", expressionGenerator("nodes"));
  grammarBuilder.defineGrammarQuery("edges", "sql_select_edges", "Query: SQL Edges Select", expressionGenerator("edges"));

  const commandExp = `Query_SQL_Select__SelectToken _ d:(${expressionGenerator("nodes")}/${expressionGenerator("edges")}/${expressionGeneratorQuery("edges")}/${expressionGeneratorQuery("nodes")}) {return d}`;
  grammarBuilder.defineGrammarCommand("select", "Select Command", commandExp);
}

// Layout extension Registration
// 1. Access Loader - 2. Create declaration Object - 3. Register Extension
let loader = (window as { [key: string]: any })[ProtoGraphLoaderNamespace];
let declaration: ExtensionDeclaration = { name: "query_sql_select", exec: init, grammar: defineGrammar };
loader.register(declaration);


////////////////////////////////////////////////////////////////////////////////


const PREFIX_PLACEHOLDER = "Query_SQL_Select_";
const SAFE_PREFIX = "Query_SQL_Select_";
const baseGrammar = `

/* Tokens */

Query_SQL_Select__SelectToken
  = "SELECT"i _

Query_SQL_Select__SeparatorToken
  = ","

Query_SQL_Select__FromToken
  = "FROM"i _

Query_SQL_Select__WhereToken
  = "WHERE"i _

Query_SQL_Select__LikeToken
  = "LIKE"i _

Query_SQL_Select__OrToken
  = "OR"i _

Query_SQL_Select__AndToken
  = "AND"i _

/* Identifier */

Query_SQL_Select__Identifier "identifier"
  = anyword

Query_SQL_Select__SelectField "select valid field"
  = Query_SQL_Select__Identifier
  / "*"

Query_SQL_Select__SelectFieldRest
  = _ Query_SQL_Select__SeparatorToken _ s:Query_SQL_Select__SelectField {
    return s;
  }

Query_SQL_Select__WhereExpr "where expression"
  = Query_SQL_Select__WhereToken x:Query_SQL_Select__LogicExpr xs:Query_SQL_Select__LogicExprRest* {
    return {
      conditions: [x].concat(xs).flat(1)
    };
  }

Query_SQL_Select__LogicExpr
  = _ "(" _ x:Query_SQL_Select__LogicExpr xs:Query_SQL_Select__LogicExprRest* _ ")" _ {
    return {
type: "subquery",
data: [x].concat(xs).flat(1)
};
  }
  / _ left:Query_SQL_Select__Expr _ op:Query_SQL_Select__Operator _ right:Query_SQL_Select__Expr_Quoted _ {
    return {
      left: left,
      op: op,
      right: right
    };
  }

Query_SQL_Select__LogicExprRest
  = _ j:Query_SQL_Select__Joiner _ l:Query_SQL_Select__LogicExpr {
  return [j,l]
    return {
      joiner: j,
      expression: l
    };
  }

Query_SQL_Select__Joiner "joiner"
  = Query_SQL_Select__OrToken  { return "Or";  }
  / Query_SQL_Select__AndToken { return "And"; }

Query_SQL_Select__Operator = 
    p1:"@" p2: Query_SQL_Select__Operator_Inner {return "@" + p2}
  / p1:"!" p2:Query_SQL_Select__Operator_Inner {return "!" + p2}
  / p1:"not" _ p2:Query_SQL_Select__Operator_Inner {return "!" + p2}
  / Query_SQL_Select__Operator_Inner

Query_SQL_Select__Operator_Inner
  = "<>"       { return "!=" ; }
  / "=="       { return "="  ; }
  / "="        { return "="  ; }
  / "!="       { return "!=" ; }
  / ">="       { return ">=" ; }
  / ">"        { return ">"  ; }
  / "<="       { return "<=" ; }
  / "<"        { return "<"  ; }
  / "^="       { return "^=" ; }
  / "$="       { return "$=" ; }
  / "is" _ "like"   { return "*="  ; }
  / "has"   { return "*="  ; }
  / "includes"   { return "*="  ; }
  / "contains"   { return "*="  ; }
  / "is" _ "not"   { return "!="  ; }
  / "is"       { return "="  ; }
  / "not"      { return "!="  ; }
 / Query_SQL_Select__LikeToken  { return "Like";      }

/* Expressions */

Query_SQL_Select__Expr
  = Float
  / Integer
  / s:Query_SQL_Select__Identifier 
  / s:String

Query_SQL_Select__Expr_Quoted
  = Float
  / Integer
  / v:dynamic_single_value { return (typeof value !== 'number') ? '"' + v + '"' : v} /* Cytoscape requires strings to be quoted */
  / s:Query_SQL_Select__Identifier {return '"' + s + '"' } /* Cytoscape requires strings to be quoted */
  / s:String {return '"' + s + '"' } /* Cytoscape requires strings to be quoted */


`.replaceAll(PREFIX_PLACEHOLDER, SAFE_PREFIX);


//////////////////////////// Specific Extension Logic ////////////////////////////

export interface SqlOperation {
  left: string,
  op: string,
  right: string | number
}
export interface SqlSubQuery {
  type: "subquery",
  data: SqlConditions
}
export type SqlConditions = ("And" | "Or" | SqlSubQuery | SqlOperation)[];
export interface SqlParsedConditions {
  operation: "or" | "and",
  clauses: (SqlParsedConditions | SqlOperation)[]
}

// Extension logic

function booleanPrecedentInner(): SqlParsedConditions {
  return {
    operation: "and",
    clauses: []
  }
}
function booleanPrecedent(conditions: SqlConditions): SqlParsedConditions {
  const inner: SqlParsedConditions["clauses"] = [];
  let latestClause = booleanPrecedentInner();
  conditions.forEach(clause => {
    if (typeof clause === 'object' && clause !== null && "type" in clause && clause.type === "subquery") {
      latestClause.clauses.push(booleanPrecedent(clause.data))
    }
    else if (clause.toString().toLowerCase() === "and") {

    }
    else if (clause.toString().toLowerCase() === "or") {
      inner.push(latestClause);
      latestClause = booleanPrecedentInner();
    } else {
      latestClause.clauses.push(clause as SqlOperation);
    }
  });
  inner.push(latestClause);
  return {
    operation: "or",
    clauses: inner
  }
}
function likeSelector(con: SqlOperation, ele: cytoscape.SingularElementReturnValue): boolean {
  const left = ele.style(con.left) || ele.data(con.left);
  let right = con.right.toString().replaceAll('"', "");
  // Remove special chars
  right = right.toString().replace(new RegExp("([\\.\\\\\\+\\*\\?\\[\\^\\]\\$\\(\\)\\{\\}\\=\\!\\<\\>\\|\\:\\-])", "g"), "\\$1");
  // Replace % and _ with equivalent regex
  right = right.replace(/%/g, '.*').replace(/_/g, '.');
  // Check matches
  return RegExp('^' + right + '$', 'gi').test(left);
}
function generateSelector(con: SqlParsedConditions | SqlOperation, startingSet: cytoscape.Collection | cytoscape.Core, core: cytoscape.Core): cytoscape.Collection {
  if ("op" in con) {
    // base case
    // Cytosape needs string values to be quoted (moved this into grammar)
    let selector: cytoscape.Selector | Function | undefined = `[${con.left} ${con.op} ${con.right}]`;
    if (con.op === "Like") {
      selector = (ele: cytoscape.SingularElementReturnValue) => likeSelector(con, ele);
    }
    if (["degree", "indegree", "outdegre"].includes(con.left)) selector = `[[${con.left} ${con.op} ${con.right}]]`;
    // console.log("SQL SELECT PLUGIN: css selector", selector)
    const res = (selector) ? startingSet.filter(selector as cytoscape.Selector) : startingSet.filter(Boolean);
    return res;
  } else if (typeof con === 'object' && con !== null && "operation" in con && con.operation === 'and') {
    let fullSet: cytoscape.Collection | undefined = undefined;
    for (let c of con.clauses) {
      const cRes = generateSelector(c, core, core) as unknown as cytoscape.Collection;
      if (fullSet === undefined) fullSet = cRes;
      else fullSet = fullSet.intersect(cRes)
    }
    if (fullSet === undefined) throw Error("Should have at least one entry")
    return fullSet;
  } else if (typeof con === 'object' && con !== null && "operation" in con && con.operation === 'or') {
    return con.clauses.reduce((agg, c) => {
      return agg.union(generateSelector(c, agg, core))
    }, core.collection()) as ReturnType<typeof generateSelector>;
  } else {
    console.log("SQL SELECT PLUGIN: Invalid con", con)
    throw Error('Non-exhaustive sql handler');
  }
}


function generateHandler(object: "nodes" | "edges" | "query"): QueryHandler {
  const objectToCytoscapeGroup: Record<typeof object, (col: cytoscape.Collection, namedParameters: Record<string, EvaluatedParameter>) => cytoscape.Collection> = {
    "nodes": (col: cytoscape.Collection, _namedParameters: Record<string, EvaluatedParameter>) => col.filter("node"),
    "edges": (col: cytoscape.Collection, _namedParameters: Record<string, EvaluatedParameter>) => col.filter("edge"),
    "query": (col: cytoscape.Collection, namedParameters: Record<string, EvaluatedParameter>) => col.intersection((namedParameters as any).baseQuery.collection),
  };
  return ({ core, parameters, namedParameters, properties, line }) => {
    if (!core.cy) throw Error("Core Cytoscape not initialized");
    const cy = core.cy;

    const conditions = namedParameters.conditions as unknown as SqlConditions;
    let elements;
    // console.log("CONDITIONS", object, conditions, namedParameters, line);
    if (conditions.length) {
      const prec = booleanPrecedent(conditions);
      elements = generateSelector(prec, cy, cy);
    } else {
      elements = cy as unknown as cytoscape.Collection;
    }
    elements = objectToCytoscapeGroup[object](elements, namedParameters)

    return {
      type: "query_result",
      keyword: line.keyword,
      query_object: [object],
      data: elements,
      collection: elements
    }
  }
}

///////////////////////////////////////////////////////////////////////////////


// Extras
export default declaration;