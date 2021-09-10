import { ExtensionDeclaration } from "../core/ExtensionLoader";
declare let declaration: ExtensionDeclaration;
export declare const test = "\nlayout \n    name: grid\n\ndirected line with 3 nodes\n\nline with 3 directed nodes\n\nline with 3 nodes directed\n\nline with 3 nodes ->\n    color: red\nline with 3 nodes -\n    color: green\n    \n// notice this points to lower numbers as opposed to ascending numbers\nline with 3 nodes <-\n    color: blue\n";
export default declaration;
