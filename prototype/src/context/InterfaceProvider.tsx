import CodeMirror from 'codemirror';
import { PegjsError } from 'pegjs';
import { AutoCompleteBuilder } from 'protograph/lib/core/AutoComplete';
import { debounce } from 'protograph/lib/core/helpers';
import { Grammar } from 'protograph/lib/grammar/grammar.types';
import { Player, PlayerState } from "protograph/lib/renderer/player";
import { CytoscapeInstance, GraphManagerPlayer } from 'protograph/lib/renderer/renderer';
import React, { RefObject, useMemo, useState } from 'react';
import { Ref } from 'react';
import { useRef } from 'react';
import { log, logStateChange } from '../core/helpers';
import { graphPlayer, headlessGraph, parser, player, videoGraph } from './init';
import { saveProgress } from './state';


export type status = { status: "success" | "error", message: string };
export type setState<status = any> = (status: status | ((status: status) => status)) => unknown;


let errorMarks: CodeMirror.TextMarker[] = [];
function clearMarks() {
    errorMarks.forEach(mark => mark.clear());
    errorMarks.length = 0;
}
function handleSyntaxError(error: PegjsError, editor: CodeMirror.Editor, setStatus: setState<status>) {
    clearMarks();
    log("Error Loading Code", error);
    // https://stackoverflow.com/questions/41405016/how-to-underline-errors-with-codemirror
    let loc = error.location;

    let from = { line: loc.start.line - 1, ch: loc.start.column - 1 - Number(loc.start.offset === loc.end.offset) };
    let to = { line: loc.end.line - 1, ch: loc.end.column - 1 };

    errorMarks.push(editor.markText(from, to, { className: 'cm-error', title: error.message }));
    setStatus({ status: "error", message: `Invalid Syntax (Line ${loc.start.line}:${loc.start.column}) ${error.message}` });
}


const autoCompleteBuilder = new AutoCompleteBuilder();
// @ts-ignore
CodeMirror.hint.simplemode = autoCompleteBuilder.generate();


function markCurrentDirectiveForAutoComplete(cm: CodeMirror.Editor, directives: Grammar.Animation) {
    // IMPORTANT location...line is 1 indexed | line is 0 indexed
    let { line } = cm.getCursor();
    line++;
    // Destructive/Mutable
    // Reverse search bc user is most likely to type at end
    for (let i = directives.length - 1; i >= 0; i--) { // For each keyframe
        for (let j = directives[i].data.length - 1; j >= 0; j--) { // For each command_line
            // "<" for start, bc we dont want to autocomplete while object is being typed only parameters
            if (directives[i].data[j].location && directives[i].data[j].location.start.line < line && directives[i].data[j].location.end.line >= line) {
                directives[i].data[j].returnAutoComplete = true;
                // console.log("HERE: Setting return atocomplete true", i, j, directives[i].data[j])
            }
        }
    }
}
/**
 * @internal
 * 
 * Uses location from PEG.js and CodeMirror cursor to find the index of the current step
 * 
 * @remark Draws significant inspiration from {@link markCurrentDirectiveForAutoComplete}
 */
function findCurrentKeyFrame(cm: CodeMirror.Editor | undefined, directives: Grammar.Animation): number {
    if (!cm) return 0;
    let { line } = cm.getCursor();
    line++;
    let index = directives.findIndex(dir => dir.location.start.line <= line && dir.location.end.line > line) // default to last
    if (index === -1) index = directives.length - 1;
    return index;
    // return 0; // Should never occur
}
const debouncedMainRender = debounce((player: InstanceType<typeof GraphManagerPlayer>, directives: Grammar.Animation, setStatus: setState<status>, startAtFrame: number = 0, setPreview?: setState<null | string> | null | undefined) => {
    player.enact(directives, setStatus, startAtFrame, false, setPreview);
    // setStatus({ status: "success", message: "No Errors" });
}, 500);
const debounceHeadless = debounce((directives: Grammar.Animation, setStatus: setState<status>, setFrames: setState<string[]>) => {
    headlessGraph.enact(directives, setStatus, setFrames);
    // setStatus({ status: "success", message: "No Errors" });
}, 200);

// Make error messaging and highlighting less aggressive so that if a user is typing in a flow they are not interrupted with an error message when they are still typing
// Base onChange debounce is 20ms
const parsingError = (codeMirrorInstance: CodeMirror.Editor, error: any, setStatus: setState<status>) => {
    codeMirrorInstance && handleSyntaxError(error, codeMirrorInstance, setStatus)
    !codeMirrorInstance && setStatus({ status: "error", message: "Invalid Syntax" });
}
const debouncedParsingError = debounce(parsingError, 350);

const debounceRunStatus = debounce((iter: number, iterRef: RefObject<number>, f: Function) => (iter === iterRef?.current) && f(), 350);

export const InterfaceContext = React.createContext<{
    preview: string | null,
    cy: CytoscapeInstance | undefined,
    status: status,
    setStatus: setState<status>,
    setCy: setState<CytoscapeInstance | undefined>,
    code: string,
    setCode: setState<string>,
    frames: string[],
    setFrames: setState<string[]>,
    playbackState: PlayerState,
    setPlaybackState: setState<PlayerState>,
    player: Player,
    codeMirrorInstance: CodeMirror.Editor | undefined,
    setCodeMirrorInstance: setState<CodeMirror.Editor | undefined>,
    onCursorActivity: (cm: CodeMirror.Editor) => void
    lastDirectives: Grammar.Animation,
    videoGraph: GraphManagerPlayer,
    starterCode: string,
    setOverrideCode: setState<string>
}>({
    preview: null,
    cy: undefined,
    status: { status: "success", message: "No Errors" },
    setStatus: (_) => { },
    setCy: () => { },
    // code: saved,
    code: "",
    setCode: (_) => { },
    frames: [],
    setFrames: (_) => { },
    playbackState: player.getState(),
    setPlaybackState: (_) => { },
    player: player,
    codeMirrorInstance: undefined,
    setCodeMirrorInstance: () => { },
    onCursorActivity: (cm: CodeMirror.Editor) => { },
    lastDirectives: [],
    videoGraph,
    starterCode: "",
    setOverrideCode: (_) => { }
});
const debouncedSaveProgress = debounce((code: string) => {
    saveProgress(code);
}, 500);
class EditorOnCursorActivity {
    constructor(public lastDirectives: Grammar.Animation) {

    }
    setDirectives(directives: Grammar.Animation) {
        this.lastDirectives = directives;
        // console.log("FIND CURRENT FRAME SET FRAMES", this.lastDirectives);
    }
    findCurrentKeyFrame(cm: CodeMirror.Editor) {
        // console.log("FIND CURRENT FRAME", this.lastDirectives);
        return findCurrentKeyFrame(cm, this.lastDirectives);
    }
}
const editorOnCursorActivity = new EditorOnCursorActivity([]);
export const InterfaceProvider: React.FC<{ starterCode: string, saveHandler?: (code: string, frames: string[]) => void, includePreview?: boolean }> = ({ children, starterCode, saveHandler = debouncedSaveProgress, includePreview = true }) => {
    const [status, setStatus] = useState<status>({ status: "success", message: "No Errors" });
    const [cy, setCy] = useState<CytoscapeInstance | undefined>(undefined);
    const [code, setCode] = useState<string>(starterCode);
    const [frames, setFrames] = useState<string[]>([]);
    const [playbackState, setPlaybackState] = useState<PlayerState>(player.getState());
    const [codeMirrorInstance, setCodeMirrorInstance] = useState<CodeMirror.Editor | undefined>(undefined);
    const [lastDirectives, setLastDirectives] = useState<Grammar.Animation>([]);
    editorOnCursorActivity.setDirectives(lastDirectives);
    const [overrideCode, setOverrideCode] = useState(starterCode);
    const [preview, setPreview] = useState<null | string>(null);
    const providerValue = {
        preview,
        code,
        status,
        setStatus,
        cy,
        setCy,
        frames,
        setFrames,
        setCode,
        playbackState,
        setPlaybackState,
        player,
        codeMirrorInstance,
        setCodeMirrorInstance,
        lastDirectives,
        onCursorActivity: (cm: CodeMirror.Editor) => {
            // console.log("cursor activity");
            // const currentCursorKeyframe = findCurrentKeyFrame(cm, lastDirectives);
            const currentCursorKeyframe = editorOnCursorActivity.findCurrentKeyFrame(cm);
            // console.log("FOUND CURRNET FRAME", currentCursorKeyframe);
            // Don't skip to (replay) if already on frame
            graphPlayer.player.skipToIfNotThere(currentCursorKeyframe);
        },
        videoGraph,
        starterCode: overrideCode,
        setOverrideCode
    }
    logStateChange("running interface update callback");

    const playerFrame = player.getFrame();
    useMemo(() => {
        graphPlayer.setOnDragFreeOn((node: cytoscape.NodeSingular, position: cytoscape.Position) => {
            if (!codeMirrorInstance) throw Error("Dependencies not ready");
            // node.position(position);;
            // node.lock();

            const id = node.id();

            // Look for position line
            const currentCursorKeyframe = playerFrame - 1;
            const directives: Grammar.Animation = JSON.parse(JSON.stringify(lastDirectives));
            const currentStepDirective = directives[currentCursorKeyframe];
            const posDecleration = currentStepDirective.data.find(line => {
                let con = true;
                con = con && line.type === "query";
                con = con && line.keyword === "union";
                con = con && line.parameters.length === 1;
                // @ts-ignore
                con = con && line.parameters[0].type === "query";
                // @ts-ignore
                con = con && line.parameters[0].keyword === "node";
                // @ts-ignore
                con = con && line.parameters[0].parameters.length === 1;
                // @ts-ignore
                con = con && line.parameters[0].parameters[0] === id;
                return con;
            });
            let newCode = "";
            const x = position.x.toFixed(2);
            const y = position.y.toFixed(2);
            if (posDecleration) {
                posDecleration.raw = `${id}\n\tx: ${x}\n\ty: ${y}\n`;
            } else {
                // @ts-ignore
                currentStepDirective.data.push({ raw: `\n\n${id}\n\tx: ${x}\n\ty: ${y}\n\n` });
            }
            // Rebuild
            let codeArr = directives.map(frame => ({
                ...frame, code: frame.data.map(line => {
                    return line.raw;
                })
            }));
            let code = codeArr.map(line => {
                line.newlines.forEach(({ index, raw }) => line.code.splice(index, 0, raw));
                return line.code.join("");
            });
            newCode = code.join("step\n")
            // console.log("FOUND DEC", currentCursorKeyframe, posDecleration, id, currentStepDirective, newCode);
            setOverrideCode(newCode);
            player.skipToIfNotThere(currentCursorKeyframe)
            // find id in raw
        });
    }, [codeMirrorInstance, lastDirectives, playerFrame]);

    useMemo(() => {
        setCode(starterCode);
    }, [starterCode]);

    useMemo(() => {
        logStateChange("running cy update playbackStateHandler")
        player.setStateHandler(setPlaybackState);
    }, [setPlaybackState]);

    useMemo(() => {
        logStateChange("running cy update callback", cy)
        cy && headlessGraph.init(cy, parser)
        cy && graphPlayer.init(cy, parser, true);
    }, [cy])

    useMemo(() => {
        // cy is proxy for if headless.core is defined
        if (headlessGraph.core) {
            headlessGraph.core.cm = codeMirrorInstance;
            headlessGraph.core.autoCompleteBuilder = autoCompleteBuilder;
        }
    }, [codeMirrorInstance])

    const iter = useRef(0);
    useMemo(() => {
        // console.log("CURRENT FRAME BEG", player.getFrame())
        // On retry override/stall most recent unrendered errors
        iter.current++;
        debounceRunStatus(iter.current, iter, () => {
            clearMarks();
            setStatus({ status: "success", message: "No Errors" });
        })
        logStateChange("running code update callback", code)
        saveHandler(code, frames);

        try {
            const directives: Grammar.Animation = parser.parse(code);
            setLastDirectives(directives);
            codeMirrorInstance && markCurrentDirectiveForAutoComplete(codeMirrorInstance, directives);
            logStateChange("Code Detected", directives, code);
            // console.log("parser code mirror line number", codeMirrorInstance?.getCursor(), directives)
            clearMarks();
            setStatus({ status: "success", message: "No Errors" });
            // graph.reset();
            try {
                // console.log("CURRENT FRAME", player.getFrame())
                debouncedMainRender(graphPlayer, directives, setStatus, Math.max(Math.min(directives.length, player.getFrame() - 1), 0), includePreview ? setPreview : undefined);
                debounceHeadless(directives, setStatus, setFrames);
            } catch (error) {
                log("Error Rendering Code", error)
                debounceRunStatus(iter.current, iter, () => setStatus({ status: "error", message: "Unsupported Command" }));
            }
        } catch (error) {
            debounceRunStatus(iter.current, iter, () => debouncedParsingError(codeMirrorInstance, error, setStatus))
        }

        // Cy is a dependency so rerender occurs when cy initialized
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [code, cy, includePreview]); // cy needed to run on initial code before user edit

    return (<InterfaceContext.Provider value={providerValue}> {children} </InterfaceContext.Provider>)
}