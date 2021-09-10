import { Grammar } from "../grammar/grammar.types";
import { DynamicAutocomplete } from "./AutoComplete";
const styfn = require("cytoscape/src/style/properties").default;

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>




const defaultPropertyAliases: Record<string, PartialBy<AliasEntry, "autocomplete">> = {
    "color": {
        autocomplete: undefined, map: (color) => {
            return {
                // "background-color": color,
                "line-color": color,
                "color": color,
                "target-arrow-color": color,
                "source-arrow-color": color
            }
        }
    },
    "line-color": {
        autocomplete: undefined, map: (color) => {
            return {
                // "background-color": color,
                "line-color": color,
                "target-arrow-color": color,
                "source-arrow-color": color
            }
        }
    },
    "labels": {
        autocomplete: undefined, map: (label) => {
            return {
                "label": label,
            }
        }
    },
    "background": {
        autocomplete: undefined, map: (color) => {
            return {
                "background-color": color,
                "line-color": color,
                "target-arrow-color": color,
                "source-arrow-color": color
            }
        }
    },
    "label-color": {
        autocomplete: undefined, map: (color) => {
            return {
                "color": color
            }
        }
    },
    "text-color": {
        autocomplete: undefined, map: (color) => {
            return {
                "color": color
            }
        }
    },
    "border": {
        autocomplete: undefined, map: (color) => {
            return {
                "border-color": color,
                "border-width": 3
            }
        }
    }
}





//////////////////////////////////////
//                                  //
//   Cytoscape Style Autocomplete   //
//                                  //
//////////////////////////////////////



// https://github.com/cytoscape/cytoscape.js/blob/unstable/src/style/properties.js
interface StylePropertyDecleration {
    alias?: boolean,
    pointsTo?: StylePropertyDecleration, // if alias
    name: string,
    type: Record<string, any>,
    group: string
}
interface DynamicAutocompleteWithExtras extends DynamicAutocomplete {
    key: string
    values: string[];
}
const cytoscapeStyleAutocomplete: DynamicAutocompleteWithExtras[] = styfn.properties.map((originalProp: StylePropertyDecleration): DynamicAutocompleteWithExtras => {
    let values: string[] = [];
    let prop: StylePropertyDecleration = (originalProp.alias) ? originalProp.pointsTo as StylePropertyDecleration : originalProp;
    if (prop.type.enum && prop.type.enum.length) values = values.concat(prop.type.enum);
    if (prop.type.enums && prop.type.enums.length) values = values.concat(prop.type.enums);
    if (prop.type.number) values.push("number");
    if (prop.type.string) values.push("string");
    if (prop.type.color) values.push("color");
    if (prop.type.regexes) values.push("regex-verified");
    return {
        insertText: originalProp.name,
        displayText: `${originalProp.name}: ${values.join(" / ")}`,
        options: [...(prop?.type?.enum || []), ...(prop?.type?.enums || [])].map(item => ({ insertText: item, displayText: item })),
        description: (!!originalProp.alias) ? `Alias for ${originalProp.pointsTo?.name}` : undefined,
        key: originalProp.name,
        values: values
    }
    // TOOD: Add ProtoGraph Alias
});
export function cytoscapeStyleAutocompleteSearch(firstIndentedWord: string, autocompleteEntries = cytoscapeStyleAutocomplete): DynamicAutocompleteWithExtras[] {
    return autocompleteEntries
        .filter((item: DynamicAutocompleteWithExtras) => item.key.includes(firstIndentedWord));
}










//////////////////////////////////////
//                                  //
//      Style Property Aliases      //
//                                  //
//////////////////////////////////////




/**
 * Takes in a value of an original property and returns an object of properties.
 * 
 * @remark Only used for styling and does not affect set data properties
 * 
 * @example An example for color -> background-color
 * ```ts
 * (color: string) => ({background-color: color})
 * ```
 */
type AliasHandler = (val: any) => Record<string, any>;
/**
 * Allows map/handler and optional autocomplete
 */
type AliasEntry = { map: AliasHandler, autocomplete: DynamicAutocomplete };
/**
 * Wraps Cytoscape Properties and Allows for Aliases
 */
export class StylePropertiesHandler {
    constructor(includeDefault = true) {
        if (includeDefault) {
            Object.entries(defaultPropertyAliases).forEach(([key, val]) => {
                this.addAliases(key, val.map, val.autocomplete);
            })
        }
    }
    aliases: Map<string, AliasEntry> = new Map();
    addAliases(aliasName: string, map: AliasHandler, autocomplete?: DynamicAutocomplete) {
        this.aliases.set(aliasName, { map, autocomplete: autocomplete || this.defaultAliasAutocomplete(aliasName, map) });
        this.updateAutocompleteEntries();
    }
    // Parse Only (Replace Aliases)
    parse(originalStyleProps: Record<string, any>): Record<string, any> {
        let newObj: Record<string, any> = {};
        for (let key in originalStyleProps) {
            const originalValue = originalStyleProps[key];
            if (this.aliases.has(key)) {
                newObj = { ...newObj, ...(this.aliases.get(key) as AliasEntry).map(originalValue) }
            } else {
                newObj[key] = originalValue;
            }
        }
        return newObj;
    }
    // Full Operation
    parseAndFilter(props: Grammar.Properties): Grammar.Properties {
        const filteredProps = this.filterValidPreProperties(props);
        return this.parse(filteredProps);
    }
    filterAndParse = this.parseAndFilter;
    // Before Parse
    validPreProperties() {
        return [...styfn.propertyNames, ...styfn.aliases.map((item: { name: string, pointsTo: string }) => item.name), ...Array.from(this.aliases.keys())];
    }
    filterValidPreProperties(props: Grammar.Properties): Grammar.Properties {
        return Object.fromEntries(Object.entries(props).filter(([a]) => this.validPreProperties().includes(a)))
    }
    // After Parse
    validPostProperties() {
        return [...styfn.propertyNames, ...styfn.aliases.map((item: { name: string, pointsTo: string }) => item.name)];
    }
    filterValidPostProperties(props: Grammar.Properties): Grammar.Properties {
        return Object.fromEntries(Object.entries(props).filter(([a]) => this.validPostProperties().includes(a)))
    }
    replace = this.parse
    handle = this.parse
    format = this.parse


    autocompleteEntries: DynamicAutocompleteWithExtras[] = cytoscapeStyleAutocomplete;
    updateAutocompleteEntries() {
        // Could be optimized ot take in the new alias and only do one set of oeprations instead of full reconstruction
        this.autocompleteEntries = cytoscapeStyleAutocomplete.filter(item => {
            // O(1) instead of O(n) to check if alias is defined
            // If alias is defined, we don't want to pass cytoscape autcomplete
            return !this.aliases.has(item.key);
        })
    }

    defaultAliasAutocomplete(key: string, map: AliasHandler): DynamicAutocomplete {
        function intersectionOfArrays(arrs: string[][]) {
            const set = arrs.map(ar => new Set(ar)).reduce((a, b) => new Set(Array.from(a).filter(i => b.has(i))));
            return Array.from(set);
        }
        const modifiesProperties = Object.keys(map(undefined));
        // Get the keys where the value is passed to directly
        const keys = Object.entries(map(undefined)).filter(([key, val]) => val === undefined).map(([key]) => key);
        const keyAutocompletes = cytoscapeStyleAutocomplete.filter(item => keys.includes(item.key));
        // Use intersection to show options that work for all passed properties
        const values = intersectionOfArrays(keyAutocompletes.map(item => item.values));
        const options = intersectionOfArrays(keyAutocompletes.map(item => (item.options || []).map(item => item.insertText)))

        // If just passes to properties then add description with alias
        let description = `Alias for ${keys.join(", ")}`;
        // If adds or modifies properties say modifies instead of alias
        if (keys.length !== modifiesProperties.length) description = `Modifies ${modifiesProperties.join(", ")}`;
        return {
            insertText: key,
            displayText: `${key}: ${values.join(" / ")}`,
            options: options.map(item => ({ insertText: item, displayText: item })),
            description
        }
    }

    autocomplete(firstIndentedWord: string) {
        const filteredCytoscapeEntries = cytoscapeStyleAutocompleteSearch(firstIndentedWord, this.autocompleteEntries);
        const aliasEntries = Array.from(this.aliases.entries()).filter(([key, spec]) => key.startsWith(firstIndentedWord)).map(([key, spec]) => {
            return spec.autocomplete;
        })
        // console.log("HANDLER AUTOCOMPLETE", filteredCytoscapeEntries, aliasEntries);
        return [...filteredCytoscapeEntries, ...aliasEntries]
    }
}

