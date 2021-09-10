// import peg from "pegjs";

// Constants
export const GRAMMAR_INSERTS = {
	"COMMAND_EXTENSION_NAMES": "COMMAND_EXTENSION_NAMES",
	"COMMAND_EXTENSION_declarationS": "COMMAND_EXTENSION_declarationS",
	"OBJECT_EXTENSION_NAMES": "OBJECT_EXTENSION_NAMES",
	"OBJECT_EXTENSION_declarationS": "OBJECT_EXTENSION_declarationS",
	"QUERY_OBJECT_EXTENSION_NAMES": "QUERY_OBJECT_EXTENSION_NAMES",
	"QUERY_OBJECT_EXTENSION_declarationS": "QUERY_OBJECT_EXTENSION_declarationS",
	"QUERY_EXTENSION_declarationS": "QUERY_EXTENSION_declarationS"
};

const helpers = `

/******************
*   Helpers     *
******************/


range = "range("i sp* start:dynamic_number sp* "," sp* end:dynamic_number sp* "," sp* step:dynamic_number sp* ")"  {return {start, end, step}}
	/ "range("i sp* start:dynamic_number sp* "," sp* end:dynamic_number sp* ")"  {return {start, end, step: null}}
    / "range("i sp* end:dynamic_number sp* ")" {return {start: null, end, step: null}}

array "Array (1-dim)" = array_parentheses / array_brackets
array_parentheses "Array ()" = "("  sp*  vs:(v:dynamic_value sp* "," sp* {return v})* v2:dynamic_value  sp*  ")" {return [...vs, v2].filter(item => item !== undefined && item !== null && item !== "")}
array_brackets "Array []" = "["  sp*  vs:(v:dynamic_value sp* "," sp* {return v})* v2:dynamic_value  sp*  "]" {return [...vs, v2].filter(item => item !== undefined && item !== null && item !== "")}

dynamic_number = Float / Integer / d:number {return parseInt(d,10)}
dynamic_value = dynamic_single_value /  d:(w:anyword_unsafe sp* {return w})* {return d.flat().join(" ")}
dynamic_single_value = boolean / Float / Integer / d:number {return parseInt(d,10)} /anyword_unsafe / null / undefined
boolean "Boolean" = d:("true"i / "false"i) {return d.toLowerCase() === "true"}
null "Null" = "null"i {return null}
undefined "Undefined" = "undefined"i {return undefined}

protected "Protected Word" = step / object_query_extensions
anyword "Word" = String / !protected anyword_unsafe {return text()}
anyword_unsafe "Word/Number/Combination" = String / [a-zA-Z0-9-]+ {return text()} / Float / Integer / number {return text()}
number "Number" = [0-9]+ {return text()}
word "Single Word" = [a-zA-Z]+ {return text()}
empty_line "Empty Line" = ((sp / tab) * (enterkey)) {return undefined} / sp+ EOL {return undefined} 
tab "Tab" = "\\t" / sp sp sp sp / sp sp
EOL "End of Line" = (sp)* enterkey / (sp)* !.
sp "Space" = " "
enterkey = "\\n" / "\\r" "\\n" ?
_ "whitespace"
    = [ \\t\\n\\r]*

Integer "integer"
  = n:[0-9]+ {
    return parseInt(n.join(""));
  }

Float "float"
  = neg:("-" {return true})? left:Integer "." right:Integer {
    return parseFloat([
      left.toString(),
      right.toString()
    ].join(".")) * ((neg) ? -1 : 1);
  }

    
/*https://stackoverflow.com/questions/33947960/allowing-for-quotes-and-unicode-in-peg-js-grammar-definitions*/
String
	= '"' chars:DoubleStringCharacter* '"' { return chars.join(''); }
	/ "'" chars:SingleStringCharacter* "'" { return chars.join(''); }

DoubleStringCharacter
	= !('"' / "\\\\") char:. { return char; }
	/ "\\\\" sequence:EscapeSequence { return sequence; }

SingleStringCharacter
	= !("'" / "\\\\") char:. { return char; }
	/ "\\\\" sequence:EscapeSequence { return sequence; }

EscapeSequence
	= "'"
	/ '"'
	/ "\\\\"
	/ "b"  { return "\\b";   }
	/ "f"  { return "\\f";   }
	/ "n"  { return "\\n";   }
	/ "r"  { return "\\r";   }
	/ "t"  { return "\\t";   }
	/ "v"  { return "\\x0B"; }


comment "Comment" = _ p:(single / multi) {return null}
single "Single Line Comment" = '//' p:([^\\n]*) {return p.join('')} / '#' p:([^\\n]*) {return p.join('')}
multi "Multi Line Comment" = "/*" inner:(!"*/" i:. {return i})* "*/" {return inner.join('')}
`;
export const base = `
{
	function findNewLines(lines) {
		return lines.reduce((agg, item, index) => (!item || !!item.prune) ? [...agg,{index, raw: item.raw}] : agg,[])
	}
    function filterCodeLine(line) {
    	return Boolean(line) && (!("prune" in line) || !line.prune)
    }
}


/******************
*   Structure     *
******************/

/* step makes everything between step a grouped item in an array */
/* IMPORTANT: make sure "step" is not command */
start 
	= s:( 
		a:code_line * (step EOL) {return {data:a.filter(filterCodeLine), newlines: findNewLines(a), location: location()}} 
		/ a:code_line + {return {data:a.filter(filterCodeLine), newlines: findNewLines(a), location: location()}} 
	)*  {return s.filter(i => i.data.length)}

/* code_line's first case allows there to be empty lines */
code_line = empty_line {return {prune: true, raw: text()}} / statement_with_properties / comment {return {prune: true, raw: text()}}

statement = val:(command / object_query / query) {return {...val, raw: text()}}


statement_with_properties = s:statement EOL vals:(collection_properties *) {
	return {
	    ...s,
        properties: vals.reduce((agg,item) => ({...agg,...item}),{}),
		location: location(),
		raw: text()
    }
}
collection_properties = tab p:((k:property sp? ":" sp? v:value {return[k,v]}) / k:property {return [k,null]}) sp* EOL {return {[p[0]]:p[1]}}
property "Property Key" = anyword_unsafe 
/*Allows multiple spaced words with or without quotes*/
value "Property Value (Space Seperated Words)" = dynamic_value

/* IMPORTANT: make sure "step" is not command */
protected_commands = step
step "Step" = "step"i



/******************
*   Objects.      *
******************/


object_query "Object/Structure" = object_query_extensions 

object_query_extensions = ${GRAMMAR_INSERTS.OBJECT_EXTENSION_NAMES}

/* Objects Extensions Defined */

${GRAMMAR_INSERTS.OBJECT_EXTENSION_declarationS}


/******************
*   Queries       *
******************/


query "Query" = query_objects

query_objects = query_object_extensions

query_object_extensions = ${GRAMMAR_INSERTS.QUERY_OBJECT_EXTENSION_NAMES}


/* Queries Extensions */

${GRAMMAR_INSERTS.QUERY_OBJECT_EXTENSION_declarationS}

/* Queries Extensions Defined */

${GRAMMAR_INSERTS.QUERY_EXTENSION_declarationS}



/******************
*   Commands      *
******************/


command "Command"
	= !protected_commands c:command_extensions { return {type: "command", ...c} }


/* Commands Extensions */

command_extensions = ${GRAMMAR_INSERTS.COMMAND_EXTENSION_NAMES}


/* Commands Extensions Defined */

${GRAMMAR_INSERTS.COMMAND_EXTENSION_declarationS}




/******************
*   Extensions    *
******************/



${helpers}
`;
// export const parser = peg.generate(base);