var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
import peg from "pegjs";
import { base, GRAMMAR_INSERTS } from "../grammar/grammar";
import loader from "./ExtensionLoader";
import { Router } from "./Router";
var UniquePrefix = (function () {
    function UniquePrefix() {
        this.prefix = "_";
        this.prefix_suffix = "_";
        this.inc = 0;
    }
    UniquePrefix.prototype.get = function () {
        this.inc++;
        return this.prefix + this.inc + this.prefix_suffix;
    };
    return UniquePrefix;
}());
var GrammarBuilder = (function () {
    function GrammarBuilder(base) {
        this.base = base;
        this.prefixer = new UniquePrefix();
        this.stores = {
            command: new Router(),
            object: new Router(),
            query_object: new Router(),
            fragment: [],
        };
    }
    GrammarBuilder.prototype.constructRuleDefinition = function (keyword, humanReadableName, expression, extraPrefix, includeUniquePrefix) {
        if (extraPrefix === void 0) { extraPrefix = ""; }
        if (includeUniquePrefix === void 0) { includeUniquePrefix = true; }
        var ruleName = (!!includeUniquePrefix ? this.prefixer.get() : "") + extraPrefix + keyword.trim();
        if (humanReadableName.includes("\""))
            throw Error("Extension grammar cannot have double quote");
        if (!humanReadableName.trim().length)
            throw Error("Extension grammar cannot be empty");
        expression = expression.replaceAll("\n", "");
        return { name: ruleName, declaration: (ruleName + " \"" + humanReadableName.trim() + "\" = " + expression.trim()).trim() };
    };
    GrammarBuilder.prototype.generate = function () {
        var _this = this;
        var grammarString = this.base;
        var commands = Array.from(this.stores.command.entries(), function (entry) { return entry[1]; });
        var command_definitions = commands.map(function (_a) {
            var keyword = _a.keyword, humanReadableName = _a.humanReadableName, fragment = _a.fragment;
            return _this.constructRuleDefinition(keyword, humanReadableName, fragment);
        });
        var command_names = command_definitions.map(function (item) { return item.name; });
        grammarString = grammarString.replace(GRAMMAR_INSERTS.COMMAND_EXTENSION_NAMES, command_names.reverse().join(" / "));
        var command_rule_declarations = command_definitions.map(function (item) { return item.declaration; });
        grammarString = grammarString.replace(GRAMMAR_INSERTS.COMMAND_EXTENSION_declarationS, command_rule_declarations.join("\n"));
        var objects = Array.from(this.stores.object.entries(), function (entry) { return entry[1]; });
        var object_definitions = objects.map(function (_a) {
            var keyword = _a.keyword, humanReadableName = _a.humanReadableName, fragment = _a.fragment;
            return _this.constructRuleDefinition(keyword, humanReadableName, fragment);
        });
        var object_names = object_definitions.map(function (item) { return item.name; });
        grammarString = grammarString.replace(GRAMMAR_INSERTS.OBJECT_EXTENSION_NAMES, object_names.reverse().join(" / "));
        var object_rule_declarations = object_definitions.map(function (item) { return item.declaration; });
        grammarString = grammarString.replace(GRAMMAR_INSERTS.OBJECT_EXTENSION_declarationS, object_rule_declarations.join("\n"));
        var query_objects = Array.from(this.stores.query_object.entries(), function (entry) { return entry[1]; });
        var queries_declarations_by_object = query_objects.map(function (qo) {
            var querys = Array.from(qo.store.entries(), function (entry) { return entry[1]; });
            var query_definitions = querys.map(function (_a) {
                var keyword = _a.keyword, humanReadableName = _a.humanReadableName, fragment = _a.fragment;
                return _this.constructRuleDefinition(keyword, humanReadableName, fragment, qo.keyword + "_");
            });
            var query_names = query_definitions.map(function (item) { return item.name; });
            return __assign(__assign({}, qo), { subrules: query_names, subdeclarations: query_definitions.map(function (item) { return item.declaration; }) });
        });
        var query_object_rule_name_prefix = "query_object_";
        var query_object_names = query_objects.map(function (qo) { return query_object_rule_name_prefix + qo.keyword; });
        grammarString = grammarString.replace(GRAMMAR_INSERTS.QUERY_OBJECT_EXTENSION_NAMES, query_object_names.reverse().join(" / "));
        var query_object_declarations = queries_declarations_by_object.map(function (qo) { return _this.constructRuleDefinition(qo.keyword, qo.humanReadableName, qo.subrules.reverse().join(" / "), query_object_rule_name_prefix, false).declaration; });
        grammarString = grammarString.replace(GRAMMAR_INSERTS.QUERY_OBJECT_EXTENSION_declarationS, query_object_declarations.join("\n"));
        var query_object_query_declarations = queries_declarations_by_object.reduce(function (agg, qo) { return __spreadArray(__spreadArray([], agg), qo.subdeclarations); }, []);
        grammarString = grammarString.replace(GRAMMAR_INSERTS.QUERY_EXTENSION_declarationS, query_object_query_declarations.join("\n"));
        grammarString += "\n" + this.stores.fragment.join("\n");
        return grammarString;
    };
    GrammarBuilder.prototype.defineGrammarObject = function (keyword, humanReadableName, fragment) {
        this.stores["object"].load(keyword, { keyword: keyword, humanReadableName: humanReadableName, fragment: fragment });
    };
    GrammarBuilder.prototype.defineGrammarCommand = function (keyword, humanReadableName, fragment) {
        this.stores["command"].load(keyword, { keyword: keyword, humanReadableName: humanReadableName, fragment: fragment });
    };
    GrammarBuilder.prototype.defineGrammarQueryObject = function (keyword, humanReadableName) {
        if (humanReadableName === void 0) { humanReadableName = null; }
        if (!humanReadableName)
            humanReadableName = "Query Object " + keyword;
        this.stores["query_object"].load(keyword, { keyword: keyword, humanReadableName: humanReadableName, store: new Router() });
    };
    GrammarBuilder.prototype.defineGrammarQuery = function (object, keyword, humanReadableName, fragment) {
        if (!this.stores["query_object"].has(object)) {
            this.defineGrammarQueryObject(object);
        }
        var map = this.stores["query_object"].get(object);
        if (!map)
            throw Error("This error should never occur");
        map.store.load(keyword, { keyword: keyword, humanReadableName: humanReadableName, fragment: fragment });
    };
    GrammarBuilder.prototype.defineGrammarFragment = function (fragment) {
        this.stores["fragment"].push(fragment);
    };
    return GrammarBuilder;
}());
export { GrammarBuilder };
var SyntaxHighlightingBuilder = (function () {
    function SyntaxHighlightingBuilder() {
        this.base = {};
        this.commands = new Set();
        this.objects = new Set();
    }
    SyntaxHighlightingBuilder.prototype.setBase = function (mode) {
        this.base = mode;
    };
    SyntaxHighlightingBuilder.prototype.defineObject = function (keyword) {
        this.objects.add(keyword);
    };
    SyntaxHighlightingBuilder.prototype.defineCommand = function (keyword) {
        this.commands.add(keyword);
    };
    SyntaxHighlightingBuilder.prototype.startOfLineRegex = function (options) {
        return new RegExp("(" + options.join("|") + ")(\\/\\/.*$|$|\\s)", 'gi');
    };
    SyntaxHighlightingBuilder.prototype.generateHighlighting = function () {
        var mode = __assign({}, this.base);
        mode.start = __spreadArray([], mode.start);
        mode.start.push({
            regex: this.startOfLineRegex(Array.from(this.commands.values())),
            sol: true,
            token: "keyword"
        });
        mode.start.push({
            regex: this.startOfLineRegex(Array.from(this.objects.values())),
            sol: true,
            token: "def"
        });
        return mode;
    };
    return SyntaxHighlightingBuilder;
}());
export { SyntaxHighlightingBuilder };
var GrammarBuilderWithSyntaxHighlighting = (function (_super) {
    __extends(GrammarBuilderWithSyntaxHighlighting, _super);
    function GrammarBuilderWithSyntaxHighlighting() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.syntaxHighlightingBuilder = new SyntaxHighlightingBuilder();
        return _this;
    }
    GrammarBuilderWithSyntaxHighlighting.prototype.defineGrammarObject = function (keyword, humanReadableName, fragment) {
        this.syntaxHighlightingBuilder.defineObject(keyword);
        _super.prototype.defineGrammarObject.call(this, keyword, humanReadableName, fragment);
    };
    GrammarBuilderWithSyntaxHighlighting.prototype.defineGrammarCommand = function (keyword, humanReadableName, fragment) {
        this.syntaxHighlightingBuilder.defineCommand(keyword);
        _super.prototype.defineGrammarCommand.call(this, keyword, humanReadableName, fragment);
    };
    GrammarBuilderWithSyntaxHighlighting.prototype.generateHighlighting = function () {
        return this.syntaxHighlightingBuilder.generateHighlighting();
    };
    return GrammarBuilderWithSyntaxHighlighting;
}(GrammarBuilder));
export { GrammarBuilderWithSyntaxHighlighting };
var ParserBuilder = (function () {
    function ParserBuilder(includeWindowExtensions) {
        if (includeWindowExtensions === void 0) { includeWindowExtensions = null; }
        this.builder = new GrammarBuilderWithSyntaxHighlighting(base);
        var extensionsToLoad = Array.from(loader.entries());
        if (Array.isArray(includeWindowExtensions)) {
            extensionsToLoad = extensionsToLoad.filter(function (_a) {
                var name = _a[0], f = _a[1];
                return includeWindowExtensions.includes(name);
            });
        }
        for (var _i = 0, extensionsToLoad_1 = extensionsToLoad; _i < extensionsToLoad_1.length; _i++) {
            var _a = extensionsToLoad_1[_i], extensionExec = _a[1];
            extensionExec.grammar && extensionExec.grammar(this.builder);
        }
    }
    ParserBuilder.prototype.generate = function () {
        return peg.generate(this.builder.generate());
    };
    ParserBuilder.prototype.generateSyntaxHighlighting = function () {
        return this.builder.generateHighlighting();
    };
    return ParserBuilder;
}());
export { ParserBuilder };
