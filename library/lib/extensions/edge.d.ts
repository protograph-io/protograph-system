import { ExtensionDeclaration } from "../core/ExtensionLoader";
import { Grammar } from "../grammar/grammar.types";
declare let declaration: ExtensionDeclaration;
export interface EdgeQuery {
    type: "query";
    keyword: "edge";
    namedParameters: {
        left: Grammar.Query;
        right: Grammar.Query;
        type: string;
    };
}
export declare type edgeMarker = "to" | "with" | "<-" | "->" | "-" | "from";
export declare type edgeType = 'undirected' | 'directed';
export default declaration;
