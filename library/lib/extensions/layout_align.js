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
import cytoscape from 'cytoscape';
import { ProtoGraphLoaderNamespace } from "../config";
import { log } from "../core/helpers";
var cola = require('cytoscape-cola');
cytoscape.use(cola);
var docs = {
    name: "Align & Separate",
    description: "Align: allows for aligning nodes in a horizontal or vertical line.\n\nSeparate: allows for separating nodes by suggesting distance between nodes.\n\n Disables the current layout and uses a force-directed layout that allows for specifying of alignment constraints.",
    category: "command",
    keywords: ["basics"],
    usage: [{
            name: "Align Vertically",
            description: "Aligns nodes in a vertical line, one on top of another.",
            codeExample: "align n1, n2 vertically",
            dependencies: ["query_node"],
        }, {
            name: "Align Horizontally",
            description: "Aligns nodes in a horizontal line, each directly next to another.",
            codeExample: "align all nodes horizontally",
            dependencies: ["query_node"],
        }, {
            name: "Separate Vertically",
            description: "Causes the *right* nodes to be below the *left* nodes by a suggested distance. In this example, n2 is 20 units below n1.",
            codeExample: "separate n1 n2 vertically 20",
            dependencies: ["query_node"],
        }, {
            name: "Separate Horizontally",
            description: "Causes the *right* nodes to be to right of the *left* nodes by a suggested distance. In this example, n2 is 20 units to the right of n1.",
            codeExample: "separate n1 n2 horizontally 20",
            dependencies: ["query_node"],
        }]
};
function init(core) {
    var layout = new LayoutAlign(core);
    var command = new AlignCommand(layout);
    core.defineHandler('object', "layout_align", layout);
    command.init(core);
}
function defineGrammar(grammarBuilder) {
    AlignCommand.defineGrammar(grammarBuilder);
    grammarBuilder.defineGrammarObject("layout_align", "Layout_Align", "'layout_align'i {return {type: \"object\", keyword: \"layout_align\", parameters: []} }");
}
function defineAutoComplete(autoCompleteRulesBuilder) {
    AlignCommand.defineAutoComplete(autoCompleteRulesBuilder);
    autoCompleteRulesBuilder.defineLineStart({
        firstWord: "layout_align",
        displayText: "layout_align\n",
        description: "Use a custom (webcola) layout to set alignment constraints. (Incompatible with `layout`)"
    });
}
var loader = window[ProtoGraphLoaderNamespace];
var declaration = {
    name: "object_layout_align",
    exec: init,
    grammar: defineGrammar,
    autocomplete: defineAutoComplete,
    docs: docs
};
loader.register(declaration);
var LayoutAlign = (function () {
    function LayoutAlign(core) {
        this.core = core;
        this.keyword = "layout";
        this.data = {
            name: 'cola',
            animate: false && !!this.core.config.animate_duration,
            alignment: { vertical: [], horizontal: [] },
            gapInequalities: [],
            maxSimulationTime: 1000
        };
        this._active = false;
        if (!this.core.cy)
            throw Error("Core Cytoscape not Initialized");
        this.layout = this.core.cy.layout(this.data);
        this.layout.run();
    }
    LayoutAlign.prototype.isActive = function () {
        return this._active;
    };
    LayoutAlign.prototype.activate = function () {
        if (this._active)
            return;
        this._active = true;
        var baseLayout = this.core.getObject("layout");
        baseLayout && baseLayout.disable();
    };
    LayoutAlign.prototype.reset = function () {
        this._active = false;
        this.data = {
            name: 'cola',
            animate: false && !!this.core.config.animate_duration,
            alignment: { vertical: [], horizontal: [] },
            gapInequalities: [],
            maxSimulationTime: 1000
        };
    };
    LayoutAlign.prototype.disable = function () {
        this._active = false;
    };
    LayoutAlign.prototype.updateLayout = function (data) {
        if (!this.core.cy)
            throw Error("Core Cytoscape not Initialized");
        try {
            this.layout = this.core.cy.layout(data);
        }
        catch (_a) {
            log("Unsupported Layout Property", this.data);
            this.layout = null;
            throw Error("Unsupported Layout Property");
        }
    };
    LayoutAlign.prototype.generateAutoComplete = function (data) {
        var booleanOptions = [
            { insertText: "true", displayText: "true" },
            { insertText: "false", displayText: "false" }
        ];
        var res = [
            { insertText: "avoidOverlap", displayText: "avoidOverlap", description: "(Default true) Try to prevents node overlap; may overflow boundingBox if not enough space.", options: booleanOptions },
            { insertText: "padding", displayText: "padding: [number]", description: "Extra spaces when fitting zoom." },
        ];
        return res;
    };
    LayoutAlign.prototype.propertiesAutoComplete = function () {
        return this.generateAutoComplete(this.data);
    };
    LayoutAlign.prototype.execute = function (_a) {
        var _this = this;
        var line = _a.line, properties = _a.properties;
        this.activate();
        var data = __assign(__assign({}, this.data), properties);
        this.updateLayout(data);
        this.data = data;
        var type = "object_result";
        return {
            type: type,
            query_object: [],
            keyword: line.keyword,
            data: line,
            extra: {},
            propertiesAutoComplete: function () { return _this.generateAutoComplete(_this.data); }
        };
    };
    LayoutAlign.prototype.onChange = function () {
        var _a, _b;
        if (this.isActive()) {
            if (!this.core.cy)
                throw Error("Core Cytoscape not Initialized");
            var nodes = this.data.alignment.horizontal.concat(this.data.alignment.vertical).flat();
            this.updateLayout({
                name: 'cola',
                animate: false && !!this.core.config.animate_duration,
                alignment: { vertical: [], horizontal: [] },
                gapInequalities: [],
            });
            (_a = this.layout) === null || _a === void 0 ? void 0 : _a.run();
            this.updateLayout(this.data);
            (_b = this.layout) === null || _b === void 0 ? void 0 : _b.run();
        }
    };
    LayoutAlign.prototype.addConstraint = function (col, axis, update) {
        if (update === void 0) { update = false; }
        this.activate();
        if (!col || col.empty())
            return col;
        var nodesCollection = col.filter("node");
        if (nodesCollection.size() < 2)
            return col;
        var constraints = nodesCollection.map(function (ele) { return ({ node: ele }); });
        this.data.alignment[axis].push(constraints);
        return col;
    };
    LayoutAlign.prototype.addGapInequality = function (col, col2, axis, distance, equality, update) {
        var _this = this;
        if (equality === void 0) { equality = false; }
        if (update === void 0) { update = true; }
        this.activate();
        if (!col || col.empty())
            return col;
        if (!col2 || col2.empty())
            return col;
        var nodesCollection = col.filter("node");
        if (nodesCollection.size() < 1)
            return col;
        var nodesCollection2 = col2.filter("node");
        if (nodesCollection2.size() < 1)
            return col;
        nodesCollection.forEach(function (left) {
            nodesCollection2.forEach(function (right) {
                _this.data.gapInequalities.push({ axis: axis, left: left, right: right, gap: distance, equality: equality });
            });
        });
        return col;
    };
    return LayoutAlign;
}());
export { LayoutAlign };
var AlignCommand = (function () {
    function AlignCommand(layout) {
        var _this = this;
        this.layout = layout;
        this.align = function (pars) {
            _this.layout.activate();
            var namedParameters = pars.namedParameters;
            var target = namedParameters.target.data;
            if (!target || target.empty())
                return namedParameters.target;
            var layout = pars.core.getObject("layout_align");
            if (namedParameters.type === "align") {
                var axis = "horizontal";
                if (namedParameters.axis === "vertically")
                    axis = "vertical";
                if (layout) {
                    layout.addConstraint(target, axis);
                }
            }
            else {
                var axis = "x";
                if (namedParameters.axis === "vertically")
                    axis = "y";
                var target2 = namedParameters.target2.data;
                if (!target2 || target2.empty())
                    return namedParameters.target;
                if (layout) {
                    layout.addGapInequality(target, target2, axis, namedParameters.distance);
                }
            }
            return namedParameters.target;
        };
    }
    AlignCommand.prototype.init = function (core) {
        core.defineHandler('command', "align", this.align);
    };
    AlignCommand.defineGrammar = function (grammarBuilder) {
        var expression = "\"align\"i sp p:query_object_nodes sp axis:(\"horizontally\"/\"vertically\") { return {keyword: \"align\", named_parameters:{type: \"align\", target:p, axis} } }";
        grammarBuilder.defineGrammarCommand("align", "Align [Query] [horizontally / vertically]", expression);
        var gapExpression = "\"separate\"i sp p:query_object_nodes sp p2:query_object_nodes sp+ axis:(\"horizontally\"/\"vertically\") sp+ dist:dynamic_number { return {keyword: \"align\", named_parameters:{type: \"gap\", target:p, target2:p2, axis, distance: dist} } }";
        grammarBuilder.defineGrammarCommand("separate", "Separate [Query] [Query] [horizontally / vertically] [number (distance)]", gapExpression);
    };
    AlignCommand.defineAutoComplete = function (autoCompleteRulesBuilder) {
        autoCompleteRulesBuilder.defineLineStart({ firstWord: "align", displayText: "align [node query] [\"horizontally\"/\"vertically\"]", description: "Align nodes to create a row or column." });
        autoCompleteRulesBuilder.defineLineStart({ firstWord: "separate", displayText: "separate [node query (left set)] [node query (right set)] [\"horizontally\"/\"vertically\"] [number (distance)]", description: "Separate the left set of nodes by a positive distance horizontally (to the right) or vertically (to the bottom) from the right set of nodes." });
    };
    return AlignCommand;
}());
export default declaration;
