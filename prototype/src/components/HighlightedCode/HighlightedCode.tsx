import { UnControlled as ReactCodeMirror } from 'react-codemirror2';
import { codeMirrorOptions } from '../Editor';
import "./HighlightedCode.scss";

export const HighlightedCode = ({ code }: { code: string }) => <ReactCodeMirror
    value={code}
    className="highlighted-code"
    options={{ ...codeMirrorOptions, readOnly: "nocursor", lineNumbers: false, lineWrapping: false }}
/>