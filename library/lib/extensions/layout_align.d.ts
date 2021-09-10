import cytoscape from 'cytoscape';
import { DynamicAutocomplete } from "../core/AutoComplete";
import { Core } from "../core/Core";
import { ExtensionDeclaration } from "../core/ExtensionLoader";
import { ExecutedParameterObject, ObjectHandler } from "../core/types";
import { Grammar } from "../grammar/grammar.types";
declare let declaration: ExtensionDeclaration;
export declare class LayoutAlign implements ObjectHandler {
    private core;
    keyword: string;
    data: {
        name: string;
        animate: boolean;
        alignment: {
            vertical: any[];
            horizontal: any[];
        };
        gapInequalities: any[];
        maxSimulationTime: number;
    };
    layout: cytoscape.Layouts | null;
    private _active;
    isActive(): boolean;
    activate(): void;
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
    addConstraint(col: cytoscape.Collection, axis: "vertical" | "horizontal", update?: boolean): cytoscape.Collection<cytoscape.SingularElementReturnValue, cytoscape.SingularElementArgument>;
    addGapInequality(col: cytoscape.Collection, col2: cytoscape.Collection, axis: "y" | "x", distance: number, equality?: boolean | string, update?: boolean): cytoscape.Collection<cytoscape.SingularElementReturnValue, cytoscape.SingularElementArgument>;
}
export default declaration;
