import { base } from "../grammar/grammar";
import loader from "./ExtensionLoader";
import { Router } from "./Router";
import { cytoscapeStyleAutocompleteSearch } from "./StyleProperties";
function getText(completion) {
    if (typeof completion === "string")
        return completion;
    else
        return completion.text;
}
function startWithTab(curLine) {
    return curLine.startsWith("\t") || curLine.startsWith("  ") || curLine.startsWith("    ");
}
function hintElement(ownerDocument) {
    return function (elt, data, cur) {
        var displayTextNode = ownerDocument.createTextNode(cur.displayText || getText(cur));
        var displayTextContainer = ownerDocument.createElement("div");
        displayTextContainer.appendChild(displayTextNode);
        var hintEntryContainer = ownerDocument.createElement("div");
        hintEntryContainer.appendChild(displayTextContainer);
        if (cur.description) {
            var descriptionTextNode = ownerDocument.createTextNode(cur.description);
            var descriptionContainer = ownerDocument.createElement("div");
            descriptionContainer.classList.add("CodeMirror-hint_description");
            descriptionContainer.appendChild(descriptionTextNode);
            hintEntryContainer.appendChild(descriptionContainer);
        }
        elt.appendChild(hintEntryContainer);
    };
}
var AutoCompleteRulesBuilder = (function () {
    function AutoCompleteRulesBuilder(base) {
        this.base = base;
        this.stores = {
            lineStarters: new Router(),
        };
        this.defineLineStart({
            firstWord: "\n",
            displayText: "[New Line]"
        });
    }
    AutoCompleteRulesBuilder.prototype.generate = function () {
        var _this = this;
        var lineStartAutoComplete = function (curLine, ownerDocument) {
            var firstWord = curLine.replace(/ .*/, '');
            if (curLine.length && !firstWord)
                return [];
            if (!curLine.trim().length)
                return [];
            var isPastFirstWord = ((firstWord === null || firstWord === void 0 ? void 0 : firstWord.length) < (curLine === null || curLine === void 0 ? void 0 : curLine.length));
            var relevantExtensions = Array.from(_this.stores["lineStarters"].entries()).filter(function (_a) {
                var keyword = _a[0];
                return keyword.includes(firstWord);
            });
            var render = hintElement(ownerDocument);
            var list = relevantExtensions.map(function (_a) {
                var _b = _a[1], firstWord = _b.firstWord, displayText = _b.displayText, _c = _b.description, description = _c === void 0 ? null : _c;
                var insertText = !firstWord.endsWith("\n") ? firstWord + " " : firstWord;
                return ({
                    text: (isPastFirstWord) ? curLine + "\n" : insertText,
                    displayText: displayText,
                    description: description,
                    render: render,
                    criteria: firstWord,
                    className: (isPastFirstWord) ? "docs" : "autocomplete",
                });
            }).sort(function (a, b) { return a.criteria.localeCompare(b.criteria); }).sort(function (a, b) { return a.criteria.indexOf(firstWord.trim()) - b.criteria.indexOf(firstWord.trim()); });
            ;
            return list;
        };
        function propertyAutoComplete(curLine, ownerDocument) {
            return [];
        }
        return function (cm) {
            var cur = cm.getCursor();
            var curLine = cm.getLine(cur.line);
            var ownerDocument = cm.getInputField().ownerDocument;
            var list;
            if (startWithTab(curLine)) {
                list = propertyAutoComplete(curLine, ownerDocument);
            }
            else {
                list = lineStartAutoComplete(curLine, ownerDocument);
            }
            var inner = { from: { line: cm.getCursor()["line"], ch: 0 }, to: cm.getCursor(), list: list };
            return inner;
        };
    };
    AutoCompleteRulesBuilder.prototype.defineLineStart = function (spec) {
        this.stores["lineStarters"].load(spec.firstWord, spec);
    };
    return AutoCompleteRulesBuilder;
}());
export { AutoCompleteRulesBuilder };
var AutoCompleteBuilder = (function () {
    function AutoCompleteBuilder(includeWindowExtensions) {
        if (includeWindowExtensions === void 0) { includeWindowExtensions = null; }
        this.builder = new AutoCompleteRulesBuilder(base);
        var extensionsToLoad = Array.from(loader.entries());
        if (Array.isArray(includeWindowExtensions)) {
            extensionsToLoad = extensionsToLoad.filter(function (_a) {
                var name = _a[0], f = _a[1];
                return includeWindowExtensions.includes(name);
            });
        }
        for (var _i = 0, extensionsToLoad_1 = extensionsToLoad; _i < extensionsToLoad_1.length; _i++) {
            var _a = extensionsToLoad_1[_i], extensionExec = _a[1];
            extensionExec.autocomplete && extensionExec.autocomplete(this.builder);
        }
    }
    AutoCompleteBuilder.prototype.generate = function () {
        return this.builder.generate();
    };
    AutoCompleteBuilder.prototype.transformAndFilter = function (cm, propertiesAutoComplete, beginning, suffix, prefix, hideFullMatch) {
        if (suffix === void 0) { suffix = ""; }
        if (prefix === void 0) { prefix = ""; }
        if (hideFullMatch === void 0) { hideFullMatch = true; }
        var ownerDocument = cm.getInputField().ownerDocument;
        var render = hintElement(ownerDocument);
        var list = propertiesAutoComplete.map(function (_a) {
            var insertText = _a.insertText, displayText = _a.displayText, _b = _a.description, description = _b === void 0 ? null : _b;
            return ({
                text: prefix + insertText + suffix,
                displayText: displayText,
                description: description,
                render: render,
                criteria: insertText
            });
        }).filter(function (_a) {
            var criteria = _a.criteria;
            return criteria.includes(beginning) && !(criteria === beginning && hideFullMatch);
        }).sort(function (a, b) { return a.criteria.localeCompare(b.criteria); }).sort(function (a, b) { return a.criteria.indexOf(beginning.trim()) - b.criteria.indexOf(beginning.trim()); });
        return list;
    };
    AutoCompleteBuilder.prototype.getPropertyAutocomplete = function (cm, cur, propertiesAutoComplete) {
        var list = [];
        var curLine = cm.getLine(cur.line);
        values: if (propertiesAutoComplete && propertiesAutoComplete.options && propertiesAutoComplete.options.length) {
            var parts = curLine.trimStart().split(":");
            if (!parts || parts.length < 2)
                break values;
            var beginning = parts[1].trimStart();
            list = this.transformAndFilter(cm, propertiesAutoComplete.options, beginning, " ", " ", false);
        }
        return { from: { line: cur.line, ch: curLine.indexOf(":") + 1, }, to: cur, list: list };
    };
    AutoCompleteBuilder.prototype.showPropertiesHint = function (cm, propertiesAutoComplete, lineType, styleHandler) {
        var _this = this;
        cm.showHint({
            completeSingle: false,
            extraKeys: {
                "Tab": ''
            },
            hint: function (cm) {
                var cur = cm.getCursor();
                var curLine = cm.getLine(cur.line);
                var firstIndentedWord = curLine.trim().replace(/ .*/, '');
                var property = firstIndentedWord.split(":")[0];
                if (!startWithTab(curLine))
                    return { from: cur, to: cur, list: [] };
                if ((lineType === "command" || lineType === "query") && firstIndentedWord.length) {
                    var stylesAutocomplete = void 0;
                    if (styleHandler) {
                        stylesAutocomplete = styleHandler.autocomplete(property);
                    }
                    else {
                        stylesAutocomplete = cytoscapeStyleAutocompleteSearch(property);
                    }
                    propertiesAutoComplete = propertiesAutoComplete.concat(stylesAutocomplete);
                }
                if (curLine.includes(":")) {
                    return _this.getPropertyAutocomplete(cm, cur, propertiesAutoComplete.find(function (item) { return item.insertText === property; }));
                }
                var list = _this.transformAndFilter(cm, propertiesAutoComplete, firstIndentedWord, ": ");
                var indentSize = 2;
                if (curLine.includes("\t"))
                    indentSize = 1;
                if (curLine.includes("    "))
                    indentSize = 4;
                var inner = { from: { line: cur.line, ch: indentSize }, to: cur, list: list };
                return inner;
            }
        });
    };
    return AutoCompleteBuilder;
}());
export { AutoCompleteBuilder };
