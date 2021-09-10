import { ExtensionDeclaration } from "../core/ExtensionLoader";
declare let declaration: ExtensionDeclaration;
export interface SqlOperation {
    left: string;
    op: string;
    right: string | number;
}
export interface SqlSubQuery {
    type: "subquery";
    data: SqlConditions;
}
export declare type SqlConditions = ("And" | "Or" | SqlSubQuery | SqlOperation)[];
export interface SqlParsedConditions {
    operation: "or" | "and";
    clauses: (SqlParsedConditions | SqlOperation)[];
}
export default declaration;
