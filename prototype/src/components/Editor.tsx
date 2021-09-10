import CodeMirror from 'codemirror';
import 'codemirror/addon/hint/show-hint.css';
import 'codemirror/addon/hint/show-hint.js';
import 'codemirror/addon/mode/simple.js';
import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/javascript/javascript.js';
import 'codemirror/mode/xml/xml.js';
import 'codemirror/theme/material.css';
import 'codemirror/theme/neat.css';
import React, { useContext, useMemo } from 'react';
import { UnControlled as ReactCodeMirror } from 'react-codemirror2';
import { InterfaceContext } from '../App';
import { setState } from '../context/InterfaceProvider';
import { logStateChange, debounce } from '../core/helpers';
import { mode } from '../editor/mode';




CodeMirror.defineSimpleMode("simplemode", mode);
export const codeMirrorOptions: CodeMirror.EditorConfiguration = {
    mode: 'simplemode',
    theme: 'material',
    lineNumbers: true,
    indentWithTabs: false,
    smartIndent: false,
    tabSize: 4,
    indentUnit: 4,
    extraKeys: {
        'Ctrl-Space': 'autocomplete',
        Tab: (cm) => cm.execCommand("indentMore"),
        "Shift-Tab": (cm) => cm.execCommand("indentLess"),
        // Rebind enter overriding newlineAndIndent so that new lines are not indented
        "Enter": cm => cm.replaceSelection("\n")
    }, // pressing CTRL + Space will trigger autocomplete,
    autofocus: true,
    lineWrapping: true
};

const codeChanged = debounce((code: string, setCode: setState<string>) => {
    logStateChange("codeChanged");
    setCode(code);
}, 20);



export const CodeMirrorMemo = React.memo(function WrappedComponent(props: any) {
    const { starterCode, setCode, setCodeMirrorInstance, onCursorActivity } = useContext(InterfaceContext);
    logStateChange("rerending code mirror react wrapper");

    // Only needs to render once
    return useMemo(() => {
        const codeMirrorOnChange = (editor: CodeMirror.Editor, data: any, value: string) => {
            logStateChange("codeMirrorOnChange")
            // console.log("HERE: Editor");
            codeChanged(value, setCode);
            editor.showHint({
                completeSingle: false, extraKeys: {
                    "Tab": ''
                }
            });
        }
        logStateChange("rerending code mirror innner component");
        return <div className="graph-editor"><ReactCodeMirror
            value={starterCode}
            className=""
            options={{...codeMirrorOptions, ...(props.options ?? {})}}
            onChange={props?.onChange || codeMirrorOnChange}
            onCursorActivity={props?.onCursorActivity || onCursorActivity}
            editorDidMount={editor => { setCodeMirrorInstance(editor) }}
        />{props.children}</div>

        // Empty dependency to prevent rerender
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [starterCode]);
});
