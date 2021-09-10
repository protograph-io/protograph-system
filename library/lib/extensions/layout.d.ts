/// <reference types="cytoscape" />
import { DynamicAutocomplete } from "../core/AutoComplete";
import { Core } from "../core/Core";
import { ExecutedParameterObject, ObjectHandler } from "../core/types";
import { ExtensionDeclaration } from "../core/ExtensionLoader";
import { Grammar } from "../grammar/grammar.types";
declare let declaration: ExtensionDeclaration;
export declare class Layout implements ObjectHandler {
    private core;
    private active;
    keyword: string;
    data: {
        name: string;
        directed: boolean;
        animate: boolean;
    };
    layout: cytoscape.Layouts | null;
    reset(): void;
    disable(): void;
    constructor(core: Core);
    private updateLayout;
    private generateAutoComplete;
    propertiesAutoComplete(): DynamicAutocomplete[];
    execute({ line, properties }: ExecutedParameterObject<Grammar.Object>): {
        type: "object_result";
        query_object: never[];
        keyword: string;
        data: Grammar.Object;
        extra: {};
        propertiesAutoComplete: () => DynamicAutocomplete[];
    };
    onChange(): void;
}
export default declaration;
