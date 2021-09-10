import { debounce } from 'protograph/lib/core/helpers';
import { Grammar } from 'protograph/lib/grammar/grammar.types';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import ReacTour, { ReactourStepContentArgs } from 'reactour';
import { setExistingUser } from '../../App';
import { InterfaceContext } from '../../context/InterfaceProvider';
import { DocsViewContext, DocsViewContextType } from '../Docs/DocsContext';
import { HighlightedCode } from '../HighlightedCode/HighlightedCode';
import "./Tour.scss";


export type StepCheck = (directives: Grammar.Animation, code: string, docsPosition: DocsViewContextType["position"], index: number) => boolean;
export const steps: (ReacTour["props"]["steps"][number] & { check?: StepCheck, name?: string })[] = [
    {
        name: "welcome",
        selector: ".panels",
        // content: "Welcome to ProtoGraph, a tool for rapidly prototyping graph visualizations."
        content: ({ inDOM, step, goTo, close }: ReactourStepContentArgs) => {
            // console.log("tour args", args)
            return (
                <div>
                    Welcome to ProtoGraph, a tool for rapidly prototyping graph visualizations.
                    <br />
                    <br />
                    <button className="button" onClick={() => goTo(step - 1 + 1)}>Start using ProtoGraph</button>
                </div>
            )
        },
    },
    {
        name: "add",
        selector: '.editor-pane',
        // content: 'Lets start by creating your first nodes',
        content: ({ goTo, inDOM }: ReactourStepContentArgs) => (
            <div>
                Lets start by creating your first nodes! Type this into the editor:
                <br />
                <br />
                <HighlightedCode code={`add 3 nodes`}></HighlightedCode>
            </div>
        ),
        // stepInteraction: false,
        // action: (node:any) => {
        //   // by using this, focus trap is temporary disabled
        //   node.focus()
        //   console.log('yup, the target element is also focused!')
        // },
        check: (directives) => {
            return directives.some(val => val.data.some(line => {
                const query = line.parameters[0] as Grammar.Query;
                return line.keyword === "add" && query.keyword === "new_nodes" && query.parameters[0] === 3;
            }))
        }
    },
    {
        name: "render",
        selector: '.render-pane',
        content: ({ inDOM, step, goTo, close }: ReactourStepContentArgs) => {
            // console.log("tour args", args)
            return (
                <div>
                    Look your graph is rendered on the right!
                    <br />
                    <br />
                    <button className="button" onClick={() => goTo(step - 1 + 1)}>Next</button>
                </div>
            )
        },
    },
    {
        name: "connect",
        selector: '.editor-pane',
        // content: 'Lets start by creating your first nodes',
        content: ({ goTo, inDOM }: ReactourStepContentArgs) => (
            <div className="cm-s-material">
                Now let's add some edges:
                <br />
                <br />
                The <code className="cm-keyword">connect</code> command creates edges between nodes. The <code>with</code> parameter specifies an undirected edge.
                <br />
                <br />
                <HighlightedCode code={`connect n2 with n1 with n3`}></HighlightedCode>
            </div>
        ),
        check: (directives) => {
            return directives.some(val => val.data.some(line => {
                if (!line.parameters) return false;
                const query = line.parameters[0] as Grammar.Query;
                let con = line.keyword === "connect" && query?.keyword === "edge" && query?.parameters.length === 5 && query?.parameters[1] === "with" && query?.parameters[3] === "with";
                let nodeQuery;
                nodeQuery = (query?.parameters[0] as Grammar.Query)?.parameters?.[0] as Grammar.Query;
                con = con && nodeQuery?.keyword === "node" && nodeQuery?.parameters?.[0] === "n2";
                nodeQuery = (query?.parameters[2] as Grammar.Query)?.parameters?.[0] as Grammar.Query;
                con = con && nodeQuery?.keyword === "node" && nodeQuery?.parameters?.[0] === "n1";
                nodeQuery = (query?.parameters[4] as Grammar.Query)?.parameters?.[0] as Grammar.Query;
                con = con && nodeQuery?.keyword === "node" && nodeQuery?.parameters?.[0] === "n3";
                return con
            }))
        }
    },
    {
        name: "connect",
        selector: '.editor-pane',
        // content: 'Lets start by creating your first nodes',
        content: ({ goTo, inDOM }: ReactourStepContentArgs) => (
            <div className="cm-s-material">
                And some directed edges:
                <br />
                <br />
                The <code>to</code> and <code>from</code> parameter specifies a directed edge.
                <br />
                <br />
                <HighlightedCode code={`connect n1 to n0`}></HighlightedCode>
            </div>
        ),
        check: (directives) => {
            return directives.some(val => val.data.some(line => {
                const query = line.parameters[0] as Grammar.Query;
                let con = line.keyword === "connect" && query?.keyword === "edge" && query?.parameters.length === 3 && query?.parameters[1] === "to";
                let nodeQuery;
                nodeQuery = (query?.parameters[0] as Grammar.Query)?.parameters?.[0] as Grammar.Query;
                con = con && nodeQuery?.keyword === "node" && nodeQuery?.parameters?.[0] === "n1";
                nodeQuery = (query?.parameters[2] as Grammar.Query)?.parameters?.[0] as Grammar.Query;
                con = con && nodeQuery?.keyword === "node" && nodeQuery?.parameters?.[0] === "n0";
                return con
            }))
        }
    }, {
        name: "align",
        selector: '.editor-pane',
        // content: 'Lets start by creating your first nodes',
        content: ({ goTo, inDOM }: ReactourStepContentArgs) => (
            <div className="cm-s-material">
                Now let's try out the align command.
                <br />
                <br />
                The <code className="cm-keyword">align</code> command ensures that two nodes are aligned; but, it does so by overriding the layout. Nodes can be specified as any node query; here it is a comma separated list of node ids/names. The <code>vertically</code> parameter aligns nodes in a vertical line.
                <br />
                <br />
                <HighlightedCode code={`align n2,n3 vertically`}></HighlightedCode>
            </div>
        ),
        check: (directives) => {
            return directives.some(val => val.data.some(line => {
                const query = line.named_parameters?.target as Grammar.Query | undefined;
                if (line.keyword !== "align") return false;
                let con = line.keyword === "align" && query?.keyword === "union" && line?.named_parameters?.axis === "vertically";
                let nodeQuery;
                nodeQuery = (query as Grammar.Query)?.parameters?.[0] as Grammar.Query;
                con = con && nodeQuery?.keyword === "node" && nodeQuery?.parameters?.[0] === "n2";
                nodeQuery = (query as Grammar.Query)?.parameters?.[1] as Grammar.Query;
                con = con && nodeQuery?.keyword === "node" && nodeQuery?.parameters?.[0] === "n3";
                return con
            }))
        }
    },
    {
        name: "step",
        selector: '.editor-pane',
        // content: 'Lets start by creating your first nodes',
        content: ({ goTo, inDOM }: ReactourStepContentArgs) => (
            <div className="cm-s-material">
                Look you've created your first graph in ProtoGraph &#x1F389;!
                <br />
                <br />
                Why don't we give some pop with an animation? Add the <code className="cm-atom">step</code> command to tell ProtoGraph to go to the next frame.
                <br />
                <br />
                <HighlightedCode code={`step`}></HighlightedCode>
            </div>
        ),
        check: (directives, code, position, index) => {
            const connectStep = steps.find(item => item.name === "connect")?.check;
            // Check that step exists by 2 frames being present
            // Additionally check that connect is in first frame
            // console.log("tour, STEP", directives, code.toLowerCase().includes("\nstep"), !!connectStep, connectStep && connectStep(directives.slice(0, 1), code, position))
            return code.toLowerCase().includes("\nstep") && !!connectStep && connectStep(directives.slice(0, 1), code, position, index);
        }
    },
    {
        name: "style",
        selector: '.editor-pane',
        // content: 'Lets start by creating your first nodes',
        content: ({ goTo, inDOM }: ReactourStepContentArgs) => (
            <div className="cm-s-material">
                Finally, let's give the graph some color in the animation and hide the labels.
                <br />
                <br />
                We can change style and data properties like this:
                <br />
                <br />
                <HighlightedCode code={`all nodes\n\tbackground-color : red\n\tlabel : ""`}></HighlightedCode>
            </div>
        ),
        check: (directives, code, position, index) => {
            const connectStep = steps.find(item => item.name === "connect")?.check;
            // Check that step exists by 2 frames being present
            // Additionally check that connect is in first frame
            let con = directives.length === 2 && !!connectStep && connectStep(directives.slice(0, 1), code, position, index);
            con = con && directives[1].data.some(line => {
                let con = line.type === "query" && line.keyword === "all_nodes";
                const props = line.properties;
                con = con && !!props?.["background-color"] && props?.["background-color"] === "red";
                con = con && !!props && "label" in props && props["label"] !== undefined && props["label"] !== null && typeof props["label"] === "string" && props["label"].trim().length === 0;
                return con;
            })
            // console.log("outer con");
            return con;
        }
    },
    {
        selector: ".playback-controls",
        content: ({ inDOM, step, goTo, close }: ReactourStepContentArgs) => {
            // console.log("tour args", args)
            return (
                <div>
                    View previews of your animation here and use the playback controls to play and navigate your animation.
                    <br />
                    <br />
                    <button className="button" onClick={() => goTo(step - 1 + 1)}>Next</button>
                </div>
            )
        },
    },
    {
        selector: ".toolbar",
        content: ({ inDOM, step, goTo, close }: ReactourStepContentArgs) => {
            // console.log("tour args", args)
            return (
                <div>
                    There is also a built in info/documentation (docs) section. Feel free to open it to check how a command works or to explore more.
                    <br />
                    <br />
                    Click on one of the other &apos;Docs&apos; icons to open the docs window on the right or below your code.
                </div>
            )
        },
        check: (directives, code, position) => {
            return position !== "hidden";
        }
    },
    {
        selector: ".toolbar",
        content: ({ inDOM, step, goTo, close }: ReactourStepContentArgs) => {
            // console.log("tour args", args)
            return (
                <div>
                    You did it! You made your first graph visualization with ProtoGraph.
                    <br />
                    <br />
                    Share your graph by clicking "Share" or try an example by clicking "New".
                    <br />
                    <br />
                    <button className="button" onClick={() => close()}>Close</button>
                </div>
            )
        },
    }
    // ...
];

export const tourStarterCode = `layout\n\tname: breadthfirst\n\n\n`;

const debounceCheck = debounce((check: StepCheck | undefined, lastDirectives: Grammar.Animation, code: string, next: () => void, docsPosition: DocsViewContextType["position"], stepIndex: number) => {
    const moveOn = !!check && check(lastDirectives, code, docsPosition, stepIndex);
    if (moveOn) next();
}, 100)
// const debounceValidate = debounce((check: ((directives: Grammar.Animation, code: string, position: DocsViewContextType["position"]) => boolean) | undefined, lastDirectives: Grammar.Animation, code: string, next: () => void, docsPosition: DocsViewContextType["position"]) => {
//     return !!check && check(lastDirectives, code, docsPosition);
// }, 100);

export const TourContext = React.createContext<{ check: (index: number) => boolean, next: () => void, priorError: (index: number) => null | number, setStepIndex: (a: number) => void }>({ check: () => false, next: () => { }, priorError: () => null, setStepIndex: () => { } });
export const ValidateTourNext: React.FC<{ step: number, style?: React.CSSProperties }> = ({ step, children, style = {} }) => {
    const { check, next, priorError, setStepIndex } = useContext(TourContext);

    const validPrior = priorError(step);


    const valid = check(step);
    const [label, setLabel] = useState<string | null>(null);
    const onClick = useCallback(() => {
        if (valid && validPrior === null) next();
        else if (validPrior === null) {
            setLabel("Not quite right.")
        }
    }, [next, valid, validPrior]);
    // Remove after time interval
    // useEffect(() => {
    //     if (!!label) {
    //         window.setTimeout(() => {
    //             setLabel(null);
    //         }, 2000);
    //     }
    // }, [label]);
    useEffect(() => {
        if (!!label && !!valid) {
            setLabel(null);
        }
    }, [valid, label]);


    return <>
        <button className="button" onClick={onClick} style={(valid && validPrior === null) ? { transition: 'all 0.15s', ...style } : { background: "#263238", transition: 'all 0.15s', opacity: '0.5', ...style }}>{children}</button>
        <span style={{ marginLeft: "0.5rem", color: "red" }}>{label}</span>
        {
            validPrior !== null &&
            <>
                <br /><br />
                <span style={{ color: "red", cursor: "pointer" }} onClick={() => setStepIndex(validPrior)}>Oops looks like you undid a previous step. Go back to <b>step {validPrior + 1}</b></span>
            </>
        }
    </>
}
export const ValidateTourPrior: React.FC<{ step: number, style?: React.CSSProperties }> = ({ step, children, style = {} }) => {
    const { priorError, setStepIndex } = useContext(TourContext);
    const valid = priorError(step);
    if (valid === null) return null;
    return <>
        <br /><br />
        <span style={{ color: "red" }} onClick={() => setStepIndex(valid)}>Oops looks like you undid a previous step. Go back to step {valid + 1}</span>
    </>
}
export function Tour({ isTourOpen: _isTourOpen, rememberUser = true, onFinish, steps: _steps = steps, openOverride = true, autoProgress = true, onClose = () => { } }: { isTourOpen: boolean, rememberUser?: boolean, onFinish?: () => void, steps?: typeof steps, openOverride?: boolean, autoProgress?: boolean, onClose?: () => void }) {
    const [isTourOpen, setIsTourOpen] = useState(_isTourOpen);
    const [stepIndex, setStepIndex] = useState(0);
    const next = useCallback(() => {
        setStepIndex(i => {
            if (i + 1 === _steps.length - 1) {
                onFinish && onFinish();
            }
            return i + 1
        });
    }, [_steps.length, onFinish]);
    const { lastDirectives, code } = useContext(InterfaceContext);
    const { position } = useContext(DocsViewContext);
    const priorError = useCallback((index: number) => {
        // Check that all prior steps are valid
        for (let i = 0; i < index; i++) {
            let stepCon = (!(_steps[i] && _steps[i]?.check) || (_steps[i] && _steps[i]?.check && !!(_steps[i]?.check as (StepCheck))(lastDirectives, code, position, index))) as boolean
            if (!stepCon) return i;
        }
        return null;
    }, [_steps, code, lastDirectives, position]);
    const contextValue = useMemo(() => {
        return {
            // _steps,
            next,
            // stepIndex,
            check: (index: number) => index === stepIndex && (!(_steps[stepIndex] && _steps[stepIndex]?.check) || (_steps[stepIndex] && _steps[stepIndex]?.check && !!(_steps[stepIndex]?.check as (StepCheck))(lastDirectives, code, position, index))) as boolean,
            priorError,
            setStepIndex
        };
    }, [next, priorError, stepIndex, _steps, lastDirectives, code, position])
    useEffect(() => {
        // console.log("outer tour CHECKING for step", stepIndex, position)
        // console.log("tour CHECKING for step", stepIndex, position, lastDirectives)
        if (autoProgress && _steps[stepIndex] && _steps[stepIndex]?.check) {
            const check = _steps[stepIndex].check;
            debounceCheck(check, lastDirectives, code, next, position, stepIndex);
        }
    }, [lastDirectives, stepIndex, code, _steps, position, autoProgress]);
    return <TourContext.Provider value={contextValue}>
        <ReacTour
            steps={_steps}
            isOpen={isTourOpen && openOverride}
            onRequestClose={() => {
                if (stepIndex === _steps.length - 1) {
                    setIsTourOpen(false);
                    onClose();
                }
            }}
            disableDotsNavigation={true}
            disableFocusLock={true}
            disableKeyboardNavigation={true}
            showNavigationNumber={false}
            showNumber={true}
            showNavigation={false} // dots
            rounded={4}
            getCurrentStep={(step) => setStepIndex(step)}
            goToStep={stepIndex}
            showButtons={false} // hides next previous arrows
            nextStep={() => undefined} // Disables next action
            startAt={stepIndex}
            className="reactour"
            onAfterOpen={() => rememberUser && setExistingUser()}
        />
    </TourContext.Provider>
}

export default Tour;