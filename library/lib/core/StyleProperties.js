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
var styfn = require("cytoscape/src/style/properties").default;
var defaultPropertyAliases = {
    "color": {
        autocomplete: undefined, map: function (color) {
            return {
                "line-color": color,
                "color": color,
                "target-arrow-color": color,
                "source-arrow-color": color
            };
        }
    },
    "line-color": {
        autocomplete: undefined, map: function (color) {
            return {
                "line-color": color,
                "target-arrow-color": color,
                "source-arrow-color": color
            };
        }
    },
    "labels": {
        autocomplete: undefined, map: function (label) {
            return {
                "label": label,
            };
        }
    },
    "background": {
        autocomplete: undefined, map: function (color) {
            return {
                "background-color": color,
                "line-color": color,
                "target-arrow-color": color,
                "source-arrow-color": color
            };
        }
    },
    "label-color": {
        autocomplete: undefined, map: function (color) {
            return {
                "color": color
            };
        }
    },
    "text-color": {
        autocomplete: undefined, map: function (color) {
            return {
                "color": color
            };
        }
    },
    "border": {
        autocomplete: undefined, map: function (color) {
            return {
                "border-color": color,
                "border-width": 3
            };
        }
    }
};
var cytoscapeStyleAutocomplete = styfn.properties.map(function (originalProp) {
    var _a, _b, _c;
    var values = [];
    var prop = (originalProp.alias) ? originalProp.pointsTo : originalProp;
    if (prop.type.enum && prop.type.enum.length)
        values = values.concat(prop.type.enum);
    if (prop.type.enums && prop.type.enums.length)
        values = values.concat(prop.type.enums);
    if (prop.type.number)
        values.push("number");
    if (prop.type.string)
        values.push("string");
    if (prop.type.color)
        values.push("color");
    if (prop.type.regexes)
        values.push("regex-verified");
    return {
        insertText: originalProp.name,
        displayText: originalProp.name + ": " + values.join(" / "),
        options: __spreadArray(__spreadArray([], (((_a = prop === null || prop === void 0 ? void 0 : prop.type) === null || _a === void 0 ? void 0 : _a.enum) || [])), (((_b = prop === null || prop === void 0 ? void 0 : prop.type) === null || _b === void 0 ? void 0 : _b.enums) || [])).map(function (item) { return ({ insertText: item, displayText: item }); }),
        description: (!!originalProp.alias) ? "Alias for " + ((_c = originalProp.pointsTo) === null || _c === void 0 ? void 0 : _c.name) : undefined,
        key: originalProp.name,
        values: values
    };
});
export function cytoscapeStyleAutocompleteSearch(firstIndentedWord, autocompleteEntries) {
    if (autocompleteEntries === void 0) { autocompleteEntries = cytoscapeStyleAutocomplete; }
    return autocompleteEntries
        .filter(function (item) { return item.key.includes(firstIndentedWord); });
}
var StylePropertiesHandler = (function () {
    function StylePropertiesHandler(includeDefault) {
        var _this = this;
        if (includeDefault === void 0) { includeDefault = true; }
        this.aliases = new Map();
        this.filterAndParse = this.parseAndFilter;
        this.replace = this.parse;
        this.handle = this.parse;
        this.format = this.parse;
        this.autocompleteEntries = cytoscapeStyleAutocomplete;
        if (includeDefault) {
            Object.entries(defaultPropertyAliases).forEach(function (_a) {
                var key = _a[0], val = _a[1];
                _this.addAliases(key, val.map, val.autocomplete);
            });
        }
    }
    StylePropertiesHandler.prototype.addAliases = function (aliasName, map, autocomplete) {
        this.aliases.set(aliasName, { map: map, autocomplete: autocomplete || this.defaultAliasAutocomplete(aliasName, map) });
        this.updateAutocompleteEntries();
    };
    StylePropertiesHandler.prototype.parse = function (originalStyleProps) {
        var newObj = {};
        for (var key in originalStyleProps) {
            var originalValue = originalStyleProps[key];
            if (this.aliases.has(key)) {
                newObj = __assign(__assign({}, newObj), this.aliases.get(key).map(originalValue));
            }
            else {
                newObj[key] = originalValue;
            }
        }
        return newObj;
    };
    StylePropertiesHandler.prototype.parseAndFilter = function (props) {
        var filteredProps = this.filterValidPreProperties(props);
        return this.parse(filteredProps);
    };
    StylePropertiesHandler.prototype.validPreProperties = function () {
        return __spreadArray(__spreadArray(__spreadArray([], styfn.propertyNames), styfn.aliases.map(function (item) { return item.name; })), Array.from(this.aliases.keys()));
    };
    StylePropertiesHandler.prototype.filterValidPreProperties = function (props) {
        var _this = this;
        return Object.fromEntries(Object.entries(props).filter(function (_a) {
            var a = _a[0];
            return _this.validPreProperties().includes(a);
        }));
    };
    StylePropertiesHandler.prototype.validPostProperties = function () {
        return __spreadArray(__spreadArray([], styfn.propertyNames), styfn.aliases.map(function (item) { return item.name; }));
    };
    StylePropertiesHandler.prototype.filterValidPostProperties = function (props) {
        var _this = this;
        return Object.fromEntries(Object.entries(props).filter(function (_a) {
            var a = _a[0];
            return _this.validPostProperties().includes(a);
        }));
    };
    StylePropertiesHandler.prototype.updateAutocompleteEntries = function () {
        var _this = this;
        this.autocompleteEntries = cytoscapeStyleAutocomplete.filter(function (item) {
            return !_this.aliases.has(item.key);
        });
    };
    StylePropertiesHandler.prototype.defaultAliasAutocomplete = function (key, map) {
        function intersectionOfArrays(arrs) {
            var set = arrs.map(function (ar) { return new Set(ar); }).reduce(function (a, b) { return new Set(Array.from(a).filter(function (i) { return b.has(i); })); });
            return Array.from(set);
        }
        var modifiesProperties = Object.keys(map(undefined));
        var keys = Object.entries(map(undefined)).filter(function (_a) {
            var key = _a[0], val = _a[1];
            return val === undefined;
        }).map(function (_a) {
            var key = _a[0];
            return key;
        });
        var keyAutocompletes = cytoscapeStyleAutocomplete.filter(function (item) { return keys.includes(item.key); });
        var values = intersectionOfArrays(keyAutocompletes.map(function (item) { return item.values; }));
        var options = intersectionOfArrays(keyAutocompletes.map(function (item) { return (item.options || []).map(function (item) { return item.insertText; }); }));
        var description = "Alias for " + keys.join(", ");
        if (keys.length !== modifiesProperties.length)
            description = "Modifies " + modifiesProperties.join(", ");
        return {
            insertText: key,
            displayText: key + ": " + values.join(" / "),
            options: options.map(function (item) { return ({ insertText: item, displayText: item }); }),
            description: description
        };
    };
    StylePropertiesHandler.prototype.autocomplete = function (firstIndentedWord) {
        var filteredCytoscapeEntries = cytoscapeStyleAutocompleteSearch(firstIndentedWord, this.autocompleteEntries);
        var aliasEntries = Array.from(this.aliases.entries()).filter(function (_a) {
            var key = _a[0], spec = _a[1];
            return key.startsWith(firstIndentedWord);
        }).map(function (_a) {
            var key = _a[0], spec = _a[1];
            return spec.autocomplete;
        });
        return __spreadArray(__spreadArray([], filteredCytoscapeEntries), aliasEntries);
    };
    return StylePropertiesHandler;
}());
export { StylePropertiesHandler };
