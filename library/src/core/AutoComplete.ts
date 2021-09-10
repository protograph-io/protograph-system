import CodeMirror from "codemirror";
import { base } from "../grammar/grammar";
import { Grammar } from "../grammar/grammar.types";
import loader from "./ExtensionLoader";
import { Router } from "./Router";
import { cytoscapeStyleAutocompleteSearch, StylePropertiesHandler } from "./StyleProperties";

// Pulled from show-hint.js source
function getText(completion: any) {
    if (typeof completion === "string") return completion;
    else return completion.text;
}
function startWithTab(curLine: string): boolean {
    // Allows tab key, 2 space tab, 4 space tab
    return curLine.startsWith("\t") || curLine.startsWith("  ") || curLine.startsWith("    ")
}

/**
 * Returns a render function that creates a hint with a title and description.
 * 
 * @remark The description is based on `hint.description` and title is `hint.displayText`.
 *
 * @returns The render function required by show-hint.js
 *
 */
function hintElement(ownerDocument: Document) {
    return (elt: any, data: any, cur: any) => {
        // // Pulled from show-hint.js source
        // elt.appendChild(ownerDocument.createTextNode(cur.displayText || getText(cur)));
        const displayTextNode = ownerDocument.createTextNode(cur.displayText || getText(cur));
        const displayTextContainer = ownerDocument.createElement("div");
        displayTextContainer.appendChild(displayTextNode);

        // hint_element_container
        const hintEntryContainer = ownerDocument.createElement("div");
        hintEntryContainer.appendChild(displayTextContainer);

        if (cur.description) {
            // Documentation info
            const descriptionTextNode = ownerDocument.createTextNode(cur.description);
            const descriptionContainer = ownerDocument.createElement("div");
            descriptionContainer.classList.add("CodeMirror-hint_description")
            descriptionContainer.appendChild(descriptionTextNode);
            hintEntryContainer.appendChild(descriptionContainer);
        }

        elt.appendChild(hintEntryContainer);
    }
}

/** The specification for an autocomplete item. Used to construct the element showed to the user and instruct the editor when to open autocomplete. */
export interface AutoCompleterSpec {
    /** The trigger and inserted text (if selected) for the autocomplete. */
    firstWord: string;
    /** 
     * The text that shows up when autocompletes suggests this item.  
     * 
     * @remark This should be used to outline the format of the line, including potential parameters.
     * @remark This should not be used to describe the code line's functionality. Instead use `description`.
     * 
     * @example `"connect [node query] [edge type] [node query]"`
     * */
    displayText: string;
    /** 
     * This should provide the user a brief description of the purpose of the code line.
     * 
     * @remark This shows up under `displayText` in the autocomplete option.
     * @remark This is not required as the user will learn the functionality of a line over time.
     * @remark Keep short so the user can easily see multiple autocomplete options.
     * 
     * @example `"Creates edges between two sets of nodes."`
     * */
    description?: string;
}
/** The specification for an autocomplete item. Used to construct the element showed to the user and instruct the editor when to open autocomplete. Allows the extensions to dynamically generate autocomplete */
export interface DynamicAutocomplete extends Omit<AutoCompleterSpec, "firstWord"> {
    /** The trigger and inserted text (if selected) for the autocomplete.
     * 
     * @example `"background-color"`
     * 
     * @remark Do **NOT** inlude the colon `:`.
     */
    insertText: string;
    /**
     * Allows for suggestions for a particular property. Only shows once the property is typed including the colon.
     */
    options?: Omit<DynamicAutocomplete, "options">[]
}
/**
 * Constructs the base CodeMirror show-hint `hint` autocomplete function.
 */
export class AutoCompleteRulesBuilder {
    constructor(private base: string) {
        this.defineLineStart({
            firstWord: "\n",
            displayText: "[New Line]"
        })
    }
    generate() {
        const lineStartAutoComplete = (curLine: string, ownerDocument: Document) => {
            var firstWord = curLine.replace(/ .*/, '');
            // This handles the case when a line starts with a space
            // Don't show any recs if starts with space
            // @ts-ignore
            if (curLine.length && !firstWord) return [];
            if (!curLine.trim().length) return [];
            const isPastFirstWord = (firstWord?.length < curLine?.length);
            // Allow to continue past first word but dont replace (motive: keep docs)
            // // If typing past first word stop showing first word suggestions
            // // @ts-ignore
            // if (firstWord?.length < curLine?.length) return [];
            const relevantExtensions = Array.from(this.stores["lineStarters"].entries()).filter(([keyword]) => keyword.includes(firstWord));
            const render = hintElement(ownerDocument);
            let list = relevantExtensions.map(([, { firstWord, displayText, description = null }]) => {
                // only adding trailing space if not ending with new line
                const insertText = !firstWord.endsWith("\n") ? firstWord + " " : firstWord;
                return ({
                    // If past first word, keep user text and go to new line, allows docs to stay open, otherwise finish first word with insertText
                    text: (isPastFirstWord) ? curLine + "\n" : insertText,
                    displayText,
                    description: description,
                    render,
                    criteria: firstWord,
                    className: (isPastFirstWord) ? "docs" : "autocomplete",
                })
            }).sort((a,b) => a.criteria.localeCompare(b.criteria)).sort((a,b) => a.criteria.indexOf(firstWord.trim()) - b.criteria.indexOf(firstWord.trim()));;
            // log("hint autocomplete", firstWord, relevantExtensions)
            return list;
        }
        function propertyAutoComplete(curLine: string, ownerDocument: Document) {
            return []
        }
        return (cm: CodeMirror.Editor) => {
            var cur = cm.getCursor();
            let curLine = cm.getLine(cur.line);
            // console.log("cur", cur)

            // Pulled from show-hint.js source
            let ownerDocument = cm.getInputField().ownerDocument;

            // Keep entries where firstWord is beginning of keyword
            // Then construct list from provided entries
            let list;
            if (startWithTab(curLine)) {
                list = propertyAutoComplete(curLine, ownerDocument);
            } else {
                list = lineStartAutoComplete(curLine, ownerDocument);
            }

            var inner = { from: { line: cm.getCursor()["line"], ch: 0 }, to: cm.getCursor(), list };
            return inner;
        }
    }

    private stores = {
        lineStarters: new Router<AutoCompleterSpec>(),
    }
    /**
     * Defines an autocomplete that is triggered by a user typing the first word of a line.
     * 
     * @remark Since the grammar treats most first words as unique (not including queries), only one autocomplete can exist for each first word.
     *
     * @returns The render function required by show-hint.js
     *
     */
    defineLineStart(spec: AutoCompleterSpec) {
        this.stores["lineStarters"].load(spec.firstWord, spec);
    }

}

export class AutoCompleteBuilder {
    private builder = new AutoCompleteRulesBuilder(base);
    constructor(includeWindowExtensions: null | string[] = null) {
        // if includeWindowExtensions === null, then load all otherwise pass array
        let extensionsToLoad = Array.from(loader.entries());
        if (Array.isArray(includeWindowExtensions)) {
            // Use includeWindowExtensions to filter window set extensions
            extensionsToLoad = extensionsToLoad.filter(([name, f]) => includeWindowExtensions.includes(name));
        }
        for (let [, extensionExec] of extensionsToLoad) {
            // Pass extension core
            extensionExec.autocomplete && extensionExec.autocomplete(this.builder);
        }
    }
    generate() {
        return this.builder.generate();
    }
    private transformAndFilter(cm: CodeMirror.Editor, propertiesAutoComplete : DynamicAutocomplete[], beginning : string, suffix = "", prefix = "", hideFullMatch = true) {
        // Pulled from show-hint.js source
        let ownerDocument = cm.getInputField().ownerDocument;
        const render = hintElement(ownerDocument);
        let list = propertiesAutoComplete.map(({ insertText, displayText, description = null }) => {
            return ({
                text: prefix + insertText + suffix,
                displayText,
                description,
                render,
                criteria: insertText
            })
        }).filter(({ criteria }) => criteria.includes(beginning) && !(criteria === beginning && hideFullMatch)).sort((a,b) => a.criteria.localeCompare(b.criteria)).sort((a,b) => a.criteria.indexOf(beginning.trim()) - b.criteria.indexOf(beginning.trim())); // !== means whole word is typed
        return list;
    }
    private getPropertyAutocomplete(cm: CodeMirror.Editor, cur: CodeMirror.Position, propertiesAutoComplete: DynamicAutocomplete | undefined) {
        // console.log("PROPERTY VAL");
        let list : ReturnType<AutoCompleteBuilder["transformAndFilter"]> = [];
        let curLine = cm.getLine(cur.line);
        // eslint-disable-next-line no-labels
        values: if(propertiesAutoComplete && propertiesAutoComplete.options && propertiesAutoComplete.options.length) {
            let parts = curLine.trimStart().split(":");
            // eslint-disable-next-line no-labels
            if (!parts || parts.length < 2) break values;
            let beginning = parts[1].trimStart();
            // console.log("PROPERTY VAL INNER", {beginning}, parts); 
            // Add prefix of space then insert right after colon
            list = this.transformAndFilter(cm, propertiesAutoComplete.options, beginning, " ", " ", false);
        }
        return { from: { line: cur.line, ch: curLine.indexOf(":") + 1, }, to: cur, list }
    }
    showPropertiesHint(cm: CodeMirror.Editor, propertiesAutoComplete: DynamicAutocomplete[], lineType: Grammar.Line["type"], styleHandler?: StylePropertiesHandler) {
        // @ts-ignore
        cm.showHint({
            completeSingle: false,
            extraKeys: {
                "Tab": ''
            },
            hint: (cm: CodeMirror.Editor) => {
                var cur = cm.getCursor();
                let curLine = cm.getLine(cur.line);
                let firstIndentedWord = curLine.trim().replace(/ .*/, '');
                let property = firstIndentedWord.split(":")[0];
                if (!startWithTab(curLine)) return { from: cur, to: cur, list: [] };
                
                // Keep entries where firstWord is beginning of keyword
                // Then construct list from provided entries
                
                if ((lineType === "command" || lineType === "query") && firstIndentedWord.length) {
                    let stylesAutocomplete;
                    if (styleHandler) {
                        stylesAutocomplete = styleHandler.autocomplete(property);
                    } else {
                        stylesAutocomplete = cytoscapeStyleAutocompleteSearch(property);
                    }
                    propertiesAutoComplete = propertiesAutoComplete.concat(stylesAutocomplete)
                }
                
                // Stop recommending after colon typed
                if (curLine.includes(":")) {
                    return this.getPropertyAutocomplete(cm, cur, propertiesAutoComplete.find(item => item.insertText === property));
                }

                let list = this.transformAndFilter(cm, propertiesAutoComplete, firstIndentedWord,  ": ")

                // Try to recognize indent size.
                let indentSize = 2;
                if (curLine.includes("\t")) indentSize = 1;
                if (curLine.includes("    ")) indentSize = 4;
                var inner = { from: { line: cur.line, ch: indentSize }, to: cur, list };
                return inner;
            }
        })
    }
}

export { };
