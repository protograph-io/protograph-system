import { ExtensionDeclaration } from "../core/ExtensionLoader";
import { Utility } from "../core/types";
export declare class IdGenerator implements Utility {
    private incrementer;
    createId(prefix?: string): string;
    reset(): void;
}
declare let declaration: ExtensionDeclaration;
export default declaration;
