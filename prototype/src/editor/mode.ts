export const mode = {
    // The start state contains the rules that are initially used
    start: [
        { regex: "step", token: "atom", sol: true },
        // {
        //     regex: new RegExp(commands.join("|"), 'gi'),
        //     token: "keyword"
        // },
        { regex: /\/\/.*/, token: "comment" },
        { regex: /#.*/, token: "comment" },
        // A next property will cause the mode to move to a different state
        { regex: /\/\*/, token: "comment", next: "comment" },
        // Edge type keyword
        // {
        //   regex: new RegExp(edge_types.join("|"), 'gi'),
        //   token: "variable-3"
        // },
    ],
    // The multi-line comment state.
    comment: [
        { regex: /.*?\*\//, token: "comment", next: "start" },
        { regex: /.*/, token: "comment" },
    ],
    // The meta property contains global information about the mode. It
    // can contain properties like lineComment, which are supported by
    // all modes, and also directives like dontIndentStates, which are
    // specific to simple modes.
    meta: {
        dontIndentStates: ["comment"],
        lineComment: ["//", "#"]
    }
};

// Token Types in Material Design
// https://codemirror.net/theme/material.css 
// keyword 
// operator 
// variable-2 
// variable-3,
// type 
// builtin 
// atom 
// number 
// def 
// string 
// string-2 
// comment 
// variable 
// tag 
// meta 
// attribute 
// property 
// qualifier 



// CodeMirror.defineSimpleMode("simplemode", {
//   // The start state contains the rules that are initially used
//   start: [
//     { regex: /[a-z$][\w$]*/, token: "variable" },
//     // The regex matches the token, the token property contains the type
//     { regex: /"(?:[^\\]|\\.)*?(?:"|$)/, token: "string" },
//     // You can match multiple tokens at once. Note that the captured
//     // groups must span the whole string in this case
//     {
//       regex: /(function)(\s+)([a-z$][\w$]*)/,
//       token: ["keyword", "variable-2"]
//     },
//     // Rules are matched in the order in which they appear, so there is
//     // no ambiguity between this one and the one above
//     {
//       regex: "add",
//       token: "keyword"
//     },
//     { regex: "step", token: "atom" },
//     { regex: /true|false|null|undefined/, token: "atom" },
//     {
//       regex: /0x[a-f\d]+|[-+]?(?:\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/i,
//       token: "number"
//     },
//     { regex: /\/\/.*/, token: "comment" },
//     { regex: /\/(?:[^\\]|\\.)*?\//, token: "variable-3" },
//     // A next property will cause the mode to move to a different state
//     { regex: /\/\*/, token: "comment", next: "comment" },
//     { regex: /[-+\/*=<>!]+/, token: "operator" },
//     // indent and dedent properties guide autoindentation
//     { regex: /[\{\[\(]/, indent: true },
//     { regex: /[\}\]\)]/, dedent: true },
//     { regex: /[a-z$][\w$]*/, token: "variable" },
//     // You can embed other modes with the mode property. This rule
//     // causes all code between << and >> to be highlighted with the XML
//     // mode.
//     { regex: /<</, token: "meta", mode: { spec: "xml", end: />>/ } }
//   ],
//   // The multi-line comment state.
//   comment: [
//     { regex: /.*?\*\//, token: "comment", next: "start" },
//     { regex: /.*/, token: "comment" }
//   ],
//   // The meta property contains global information about the mode. It
//   // can contain properties like lineComment, which are supported by
//   // all modes, and also directives like dontIndentStates, which are
//   // specific to simple modes.
//   meta: {
//     dontIndentStates: ["comment"],
//     lineComment: ["//", "#"]
//   }
// });