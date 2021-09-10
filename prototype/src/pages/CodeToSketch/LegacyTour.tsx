import { differenceInSeconds, parseISO } from 'date-fns';
import { Grammar } from 'protograph/lib/grammar/grammar.types';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import ReacTour, { ReactourStepContentArgs } from 'reactour';
import { Docs } from '../../components/Docs/Docs';
import { DocsViewProvider } from '../../components/Docs/DocsContext';
import { CodeMirrorMemo } from '../../components/Editor';
import { HighlightedCode } from '../../components/HighlightedCode/HighlightedCode';
import { Modal } from "../../components/Modal";
import { RenderPane } from '../../components/RenderPane';
import { RenderPreviewPane } from '../../components/RenderPreviewPane';
import { StatusMessage } from '../../components/StatusMessage';
import { DocsPositionButtonGroup } from '../../components/Toolbar';
import { StepCheck, Tour, tourStarterCode, ValidateTourNext } from '../../components/Tour/Tour';
import { InterfaceContext, InterfaceProvider, setState } from '../../context/InterfaceProvider';
import { BACKUP_ENABLED, DocsReportingContext, supabase, supabaseBackup } from '../Study';
import task0Image from "./assets/task0.png";
export { InterfaceContext };

export const existingUserLocalStorageKey = "existing_user";
export const newUser = !localStorage.getItem(existingUserLocalStorageKey);
export function setExistingUser(): void {
  localStorage.setItem(existingUserLocalStorageKey, "true");
}

// const styfn = require("cytoscape/src/style/properties").default;
// console.log("styles", styfn)



export const ViewContext = React.createContext<{
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: setState<boolean>
}>({
  isMobileMenuOpen: false,
  setIsMobileMenuOpen: () => undefined
});
export const ViewProvider: React.FC = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false)
  const providerValue = {
    isMobileMenuOpen,
    setIsMobileMenuOpen
  }
  return (<ViewContext.Provider value={providerValue}> {children} </ViewContext.Provider>)
}

// View Options
// const view = {
//   toolbar: true,
//   editor: true,
//   playback: true,
//   frames: true,
// };

const InfoModal: React.FC<{ enter: () => void }> = ({ enter }) => {
  return <Modal className="welcome-modal small" onBackdropClick={undefined}>
    <div className="header">
      <h1 className="title">Welcome to the <br />ProtoGraph System</h1>
      <br />
      <p className="intro">This section of the study allows you to explore the ProtoGraph System (tool) and get to know the language. We start with a brief guided tour of the tool to help you take your first steps. This section of the study is not timed, so take your time to experiment and get comfortable with the tool.</p>
      <br />
      <br />
      {/* <a href="./" className="button" style={{ background: "#263238", marginRight: "0.8rem" }}>Exit</a> */}
      <button className="button" onClick={enter}>Begin</button>
    </div>
  </Modal>
}

const StudyToolbar: React.FC<{ onNext: () => void, progressText: string, buttonText: string }> = ({ onNext, progressText, buttonText = "Submit Text" }) => {
  return <>
    <div className="toolbar">
      <div className="left">
        <h1 className="brand">ProtoGraph</h1>
        <div className="button button--clear">{progressText}</div>
      </div>
      <div className="right">
        <DocsPositionButtonGroup></DocsPositionButtonGroup>
        <div className="share button next-task-button" onClick={onNext}>{buttonText}</div>
      </div>
    </div>
  </>
}




const useStudyState: () => [boolean, () => void] = () => {
  const [studyStarted, setStudyStarted] = useState<boolean>(false);
  const start = useCallback(() => {
    setStudyStarted(true);
  }, []);
  return [studyStarted, start];
}

const studySteps: (ReacTour["props"]["steps"][number] & { check?: StepCheck, name?: string })[] = [
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
    name: "welcome",
    selector: ".editor-pane",
    // content: "Welcome to ProtoGraph, a tool for rapidly prototyping graph visualizations."
    content: ({ inDOM, step, goTo, close }: ReactourStepContentArgs) => {
      // console.log("tour args", args)
      return (
        <div>
          On the left, you can see the code editor outlined in red, where you will be able to specify what graph you want to make.
          <br />
          <br />
          <button className="button" style={{ marginRight: "0.5rem" }} onClick={() => goTo(0)}>Back</button>
          <ValidateTourNext step={step - 1}>Next</ValidateTourNext>
        </div>
      )
    },
  },
  {
    name: "render",
    selector: '.sketch-window',
    content: ({ inDOM, step, goTo, close }: ReactourStepContentArgs) => {
      // console.log("tour args", args)
      return (
        <div>
          The goal for what you are trying to create is here:
          <br />
          <br />
          <button className="button" style={{ marginRight: "0.5rem" }} onClick={() => goTo(1)}>Back</button>
          <ValidateTourNext step={step - 1}>Next</ValidateTourNext>
        </div>
      )
    },
  },
  {
    name: "render",
    selector: '.graph-render',
    content: ({ inDOM, step, goTo, close }: ReactourStepContentArgs) => {
      // console.log("tour args", args)
      return (
        <div>
          And the graph that you have currently specified will appear here.
          <br />
          <br />
          <button className="button" style={{ marginRight: "0.5rem" }} onClick={() => goTo(2)}>Back</button>
          <ValidateTourNext step={step - 1}>Next</ValidateTourNext>
        </div>
      )
    },
  },
  {
    name: "add",
    selector: '.App',
    // content: 'Lets start by creating your first nodes',
    content: ({ goTo, inDOM, step }: ReactourStepContentArgs) => {
      console.log("step editor", step)
      return (
        <div>
          Let&apos;s start by creating your first nodes!
          <br />
          <br />
          <p>Try adding this into the editor:</p>
          <HighlightedCode code={`add 3 nodes`}></HighlightedCode>
          <br />
          <br />
          <button className="button" style={{ marginRight: "0.5rem" }} onClick={() => goTo(3)}>Back</button>
          <ValidateTourNext step={step - 1}>Next</ValidateTourNext>
        </div>
      )
    },
    // stepInteraction: false,
    // action: (node:any) => {
    //   // by using this, focus trap is temporary disabled
    //   node.focus()
    //   console.log('yup, the target element is also focused!')
    // },
    check: (directives) => {
      return directives.some(val => val.data.some(line => {
        const query = (line?.parameters && line?.parameters?.[0]) as Grammar.Query;
        return line?.keyword === "add" && query?.keyword === "new_nodes" && query?.parameters?.[0] === 3;
      }))
    }
  },
  {
    name: "render",
    selector: '.graph-render',
    content: ({ inDOM, step, goTo, close }: ReactourStepContentArgs) => {
      // console.log("tour args", args)
      return (
        <div>
          Look, your graph is rendered on the bottom right! Notice that the nodes are labelled <code>n1</code>, <code>n2</code>, and <code>n3</code> for you as they are created; you can use these names to reference them later.
          <br />
          <br />
          <button className="button" style={{ marginRight: "0.5rem" }} onClick={() => goTo(4)}>Back</button>
          <ValidateTourNext step={step - 1}>Next</ValidateTourNext>
        </div>
      )
    },
  },
  {
    name: "connect",
    selector: '.App',
    // content: 'Lets start by creating your first nodes',
    content: ({ goTo, inDOM, step }: ReactourStepContentArgs) => (
      <div className="cm-s-material">
        Now let's add some edges:
        <br />
        <br />
        The <code className="cm-keyword">connect</code> command creates edges between specified nodes. The <code>with</code> parameter specifies an undirected edge.
        <br />
        <br />
        <p>In the editor, below <code><span className="cm-keyword">add</span> 3 nodes</code>, try adding the line:</p>
        <HighlightedCode code={`connect n2 with n1 with n3`}></HighlightedCode>
        <br />
        <br />
        <button className="button" style={{ marginRight: "0.5rem" }} onClick={() => goTo(5)}>Back</button>
        <ValidateTourNext step={step - 1}>Next</ValidateTourNext>
      </div>
    ),
    check: (directives, code, pos, index) => {
      if (index > 6) return true;
      return directives.some(val => val.data.some(line => {
        const query = (line?.parameters && line?.parameters?.[0]) as Grammar.Query;
        let con = line?.keyword === "connect" && query?.keyword === "edge" && query?.parameters.length === 5 && query?.parameters?.[1] === "with" && query?.parameters?.[3] === "with";
        let nodeQuery;
        nodeQuery = (query?.parameters?.[0] as Grammar.Query)?.parameters?.[0] as Grammar.Query;
        con = con && nodeQuery?.keyword === "node" && nodeQuery?.parameters?.[0] === "n2";
        nodeQuery = (query?.parameters?.[2] as Grammar.Query)?.parameters?.[0] as Grammar.Query;
        con = con && nodeQuery?.keyword === "node" && nodeQuery?.parameters?.[0] === "n1";
        nodeQuery = (query?.parameters?.[4] as Grammar.Query)?.parameters?.[0] as Grammar.Query;
        con = con && nodeQuery?.keyword === "node" && nodeQuery?.parameters?.[0] === "n3";
        return con
      })) || directives.some(val => val.data.some(line => {
        const query = (line) as Grammar.Query;
        let con = query?.keyword === "edge" && query?.parameters.length === 5 && (query?.parameters?.[1] === "-" || query?.parameters?.[1] === "with") && (query?.parameters?.[3] === "-" || query?.parameters?.[3] === "with");
        let nodeQuery;
        nodeQuery = (query?.parameters?.[0] as Grammar.Query)?.parameters?.[0] as Grammar.Query;
        con = con && nodeQuery?.keyword === "node" && nodeQuery?.parameters?.[0] === "n2";
        nodeQuery = (query?.parameters?.[2] as Grammar.Query)?.parameters?.[0] as Grammar.Query;
        con = con && nodeQuery?.keyword === "node" && nodeQuery?.parameters?.[0] === "n1";
        nodeQuery = (query?.parameters?.[4] as Grammar.Query)?.parameters?.[0] as Grammar.Query;
        con = con && nodeQuery?.keyword === "node" && nodeQuery?.parameters?.[0] === "n3";
        return con
      })) || directives.some(val => val.data.some(line => {
        const query = (line?.parameters && line?.parameters?.[0]) as Grammar.Query;
        let con = line?.keyword === "connect" && query?.keyword === "edge" && query?.parameters.length === 5 && query?.parameters?.[1] === "-" && query?.parameters?.[3] === "-";
        let nodeQuery;
        nodeQuery = (query?.parameters?.[0] as Grammar.Query)?.parameters?.[0] as Grammar.Query;
        con = con && nodeQuery?.keyword === "node" && nodeQuery?.parameters?.[0] === "n2";
        nodeQuery = (query?.parameters?.[2] as Grammar.Query)?.parameters?.[0] as Grammar.Query;
        con = con && nodeQuery?.keyword === "node" && nodeQuery?.parameters?.[0] === "n1";
        nodeQuery = (query?.parameters?.[4] as Grammar.Query)?.parameters?.[0] as Grammar.Query;
        con = con && nodeQuery?.keyword === "node" && nodeQuery?.parameters?.[0] === "n3";
        return con
      }));
    }
  },
  {
    name: "connect-shorthand",
    selector: '.App',
    // content: 'Lets start by creating your first nodes',
    content: ({ goTo, inDOM, step }: ReactourStepContentArgs) => (
      <div className="cm-s-material">
        We also have a convenient shorthand for connecting nodes. Try changing 
        <br />
        <br />
        <HighlightedCode code={`connect n2 with n1 with n3`}></HighlightedCode>
        <br />
        <br />
        To the following. Also, make sure there is a space between the node names and the '-'.
        <HighlightedCode code={`n2 - n1 - n3`}></HighlightedCode>
        <br />
        <br />
        These two commands have the same effect!
        <br />
        <br />
        <button className="button" style={{ marginRight: "0.5rem" }} onClick={() => goTo(6)}>Back</button>
        <ValidateTourNext step={step - 1}>Next</ValidateTourNext>
      </div>
    ),
    check: (directives) => {
      return directives.some(val => val.data.some(line => {
        const query = (line) as Grammar.Query;
        let con = query?.keyword === "edge" && query?.parameters.length === 5 && (query?.parameters?.[1] === "-" || query?.parameters?.[1] === "with") && (query?.parameters?.[3] === "-" || query?.parameters?.[3] === "with");
        let nodeQuery;
        nodeQuery = (query?.parameters?.[0] as Grammar.Query)?.parameters?.[0] as Grammar.Query;
        con = con && nodeQuery?.keyword === "node" && nodeQuery?.parameters?.[0] === "n2";
        nodeQuery = (query?.parameters?.[2] as Grammar.Query)?.parameters?.[0] as Grammar.Query;
        con = con && nodeQuery?.keyword === "node" && nodeQuery?.parameters?.[0] === "n1";
        nodeQuery = (query?.parameters?.[4] as Grammar.Query)?.parameters?.[0] as Grammar.Query;
        con = con && nodeQuery?.keyword === "node" && nodeQuery?.parameters?.[0] === "n3";
        return con
      })) || directives.some(val => val.data.some(line => {
        const query = (line?.parameters && line?.parameters?.[0]) as Grammar.Query;
        let con = line?.keyword === "connect" && query?.keyword === "edge" && query?.parameters.length === 5 && query?.parameters?.[1] === "-" && query?.parameters?.[3] === "-";
        let nodeQuery;
        nodeQuery = (query?.parameters?.[0] as Grammar.Query)?.parameters?.[0] as Grammar.Query;
        con = con && nodeQuery?.keyword === "node" && nodeQuery?.parameters?.[0] === "n2";
        nodeQuery = (query?.parameters?.[2] as Grammar.Query)?.parameters?.[0] as Grammar.Query;
        con = con && nodeQuery?.keyword === "node" && nodeQuery?.parameters?.[0] === "n1";
        nodeQuery = (query?.parameters?.[4] as Grammar.Query)?.parameters?.[0] as Grammar.Query;
        con = con && nodeQuery?.keyword === "node" && nodeQuery?.parameters?.[0] === "n3";
        return con
      }))
    }
  },
  {
    name: "connect",
    selector: '.App',
    // content: 'Lets start by creating your first nodes',
    content: ({ goTo, inDOM, step }: ReactourStepContentArgs) => (
      <div className="cm-s-material">
        We can also create directed edges:
        <br />
        <br />
        The <code>to</code> and <code>from</code> parameters specify directed edges.
        <br />
        <br />
        <p>In the editor, add another line of code like:</p>
        <HighlightedCode code={`connect n1 to n0`}></HighlightedCode>
        <br />
        <br />
        <p>Or alternately:</p>
        <HighlightedCode code={`n1 -> n0`}></HighlightedCode>
        <br />
        <br />
        <button className="button" style={{ marginRight: "0.5rem" }} onClick={() => goTo(7)}>Back</button>
        <ValidateTourNext step={step - 1}>Next</ValidateTourNext>
      </div>
    ),
    check: (directives) => {
      const con1 = directives.some(val => val.data.some(line => {
        const query = (line?.parameters && line?.parameters?.[0]) as Grammar.Query;
        let con = line?.keyword === "connect" && query?.keyword === "edge" && query?.parameters.length === 3 && (query?.parameters?.[1] === "to" || query?.parameters?.[1] === "->");
        let nodeQuery;
        nodeQuery = (query?.parameters?.[0] as Grammar.Query)?.parameters?.[0] as Grammar.Query;
        con = con && nodeQuery?.keyword === "node" && nodeQuery?.parameters?.[0] === "n1";
        nodeQuery = (query?.parameters?.[2] as Grammar.Query)?.parameters?.[0] as Grammar.Query;
        con = con && nodeQuery?.keyword === "node" && nodeQuery?.parameters?.[0] === "n0";
        return con
      }))
      const con2 = directives.some(val => val.data.some(line => {
        const query = (line) as Grammar.Query;
        let con = query?.keyword === "edge" && query?.parameters.length === 3 && (query?.parameters?.[1] === "to" || query?.parameters?.[1] === "->");
        let nodeQuery;
        nodeQuery = (query?.parameters?.[0] as Grammar.Query)?.parameters?.[0] as Grammar.Query;
        con = con && nodeQuery?.keyword === "node" && nodeQuery?.parameters?.[0] === "n1";
        nodeQuery = (query?.parameters?.[2] as Grammar.Query)?.parameters?.[0] as Grammar.Query;
        con = con && nodeQuery?.keyword === "node" && nodeQuery?.parameters?.[0] === "n0";
        return con
      }));
      return con1 || con2;
    }
  },
  {
    name: "render",
    selector: '.graph-render',
    content: ({ inDOM, step, goTo, close }: ReactourStepContentArgs) => {
      // console.log("tour args", args)
      return (
        <div className="cm-s-material">
          Notice that <code>n0</code> did not exist until you added the line <code><span className="cm-keyword">connect</span> n1 to n0</code>. Nodes that don&apos;t exist will be created by connect, making it easier to build your graph quickly!
          <br />
          <br />
          <button className="button" style={{ marginRight: "0.5rem" }} onClick={() => goTo(8)}>Back</button>
          <ValidateTourNext step={step - 1}>Next</ValidateTourNext>
        </div>
      )
    },
  },
  {
    name: "render",
    selector: '.render-pane',
    content: ({ inDOM, step, goTo, close }: ReactourStepContentArgs) => {
      // console.log("tour args", args)
      return (
        <div>
          A major part of creating a graph is specifying how the graph is laid out. ProtoGraph has many tools to help you achieve the layout you want.
          <br />
          <br />
          <button className="button" style={{ marginRight: "0.5rem" }} onClick={() => goTo(9)}>Back</button>
          <ValidateTourNext step={step - 1}>Next</ValidateTourNext>
        </div>
      )
    },
  },
  {
    name: "align",
    selector: '.App',
    // content: 'Lets start by creating your first nodes',
    content: ({ goTo, inDOM, step }: ReactourStepContentArgs) => (
      <div className="cm-s-material">
        One way is by specifying a named layout. Try changing the lines:
        <br />
        <br />
        <HighlightedCode code={`layout\n\tname: breadthfirst`}></HighlightedCode>
        <br />
        <br />
        To:
        <br />
        <br />
        <HighlightedCode code={`layout\n\tname: cose`}></HighlightedCode>
        <br />
        <br />
        There are many layout options to choose from, and you should try exploring to see which ones you like!
        <br />
        <br />
        <button className="button" style={{ marginRight: "0.5rem" }} onClick={() => goTo(10)}>Back</button>
        <ValidateTourNext step={step - 1}>Next</ValidateTourNext>
      </div>
    ),
    check: (directives) => {
      return directives.some(val => val.data.some(line => {
        if (line?.keyword !== "layout") return false;
        let con = line?.keyword === "layout" && line?.properties && line?.properties.name && line?.properties.name.trim() === "cose";
        return con
      }))
    }
  },
  {
    name: "align",
    selector: '.App',
    // content: 'Lets start by creating your first nodes',
    content: ({ goTo, inDOM, step }: ReactourStepContentArgs) => (
      <div className="cm-s-material">
        You can also take a more direct approach to controlling the layout. Let's try using the align command.
        <br />
        <br />
        The <code className="cm-keyword">align</code> command ensures that two or more nodes are aligned, either horizontally or vertically. The nodes to be aligned can be specified as a comma separated list of node names, and the <code>vertically</code> parameter aligns nodes in a vertical line.
        <br />
        <br />
        <p>Below your existing code, add this line to the editor:</p>
        <HighlightedCode code={`align n2,n3 vertically`}></HighlightedCode>
        <br />
        <br />
        <button className="button" style={{ marginRight: "0.5rem" }} onClick={() => goTo(11)}>Back</button>
        <ValidateTourNext step={step - 1}>Next</ValidateTourNext>
      </div>
    ),
    check: (directives) => {
      return directives.some(val => val.data.some(line => {
        const query = line?.named_parameters?.target as Grammar.Query | undefined;
        if (line?.keyword !== "align") return false;
        let con = line?.keyword === "align" && query?.keyword === "union" && line?.named_parameters?.axis === "vertically";
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
    selector: '.App',
    // content: 'Lets start by creating your first nodes',
    content: ({ goTo, inDOM, step }: ReactourStepContentArgs) => (
      <div className="cm-s-material">
        Look you've created your first graph in ProtoGraph &#x1F389;!
        <br />
        <br />
        Why don't we give some it pop with an animation? Add the <code className="cm-atom">step</code> command at the bottom of your code to tell ProtoGraph to go to the next frame.
        <br />
        <br />
        <HighlightedCode code={`step`}></HighlightedCode>
        <br />
        <br />
        <button className="button" style={{ marginRight: "0.5rem" }} onClick={() => goTo(12)}>Back</button>
        <ValidateTourNext step={step - 1}>Next</ValidateTourNext>
      </div>
    ),
    check: (directives, code, position, index) => {
      const connectStep = studySteps.find(item => item.name === "connect-shorthand")?.check;
      // Check that step exists by 2 frames being present
      // Additionally check that connect is in first frame
      // console.log("tour, STEP", directives, code.toLowerCase().includes("\nstep"), !!connectStep, connectStep && connectStep(directives.slice(0, 1), code, position,index))
      return code.toLowerCase().includes("\nstep") && !!connectStep && connectStep(directives.slice(0, 1), code, position,index);
    }
  },
  {
    name: "style",
    selector: '.App',
    // content: 'Lets start by creating your first nodes',
    content: ({ goTo, inDOM, step }: ReactourStepContentArgs) => (
      <div className="cm-s-material">
        Let's give the graph some color in the animation and hide the labels.
        <br />
        <br />
        We can select all of the nodes and change the style and data properties like this:
        <br />
        <br />
        <HighlightedCode code={`all nodes\n\tbackground-color : red`}></HighlightedCode>
        <br />
        <b>Tip:</b> indentation matters! You can press <b>tab</b> or add four spaces before <code>background-color : red</code>.
        <br />
        Indentation tells the code interpreter that the indented line refers to the previous unindented line.
        <br />
        <br />
        <button className="button" style={{ marginRight: "0.5rem" }} onClick={() => goTo(13)}>Back</button>
        <ValidateTourNext step={step - 1}>Next</ValidateTourNext>
      </div>
    ),
    check: (directives, code, position, index) => {
      const connectStep = studySteps.find(item => item.name === "connect-shorthand")?.check;
      // Check that step exists by 2 frames being present
      // Additionally check that connect is in first frame
      let con = directives.length === 2 && !!connectStep && connectStep(directives.slice(0, 1), code, position,index);
      con = con && directives[1].data.some(line => {
        let con = line?.type === "query" && line?.keyword === "all_nodes";
        const props = line?.properties;
        con = con && !!props?.["background-color"] && props?.["background-color"] === "red";
        return con;
      })
      return con;
    }
  },
  {
    name: "style",
    selector: '.App',
    // content: 'Lets start by creating your first nodes',
    content: ({ goTo, inDOM, step }: ReactourStepContentArgs) => (
      <div className="cm-s-material">
        Finally, let’s get rid of the display labels on the nodes. To do so, we can set the <code>label</code> for all nodes to an empty string by adding <code>label: &quot;&quot;</code>. Try changing the lines
        <br />
        <br />
        <HighlightedCode code={`all nodes\n\tbackground-color : red`}></HighlightedCode>
        <br />
        <br />
        To:
        <br />
        <br />
        <HighlightedCode code={`all nodes\n\tbackground-color : red\n\tlabel: ""`}></HighlightedCode>
        <br />
        <br />
        Notice how you can change multiple attributes of the nodes just by adding another indented property below the <code>all nodes</code> query!
        <br />
        <br />
        <button className="button" style={{ marginRight: "0.5rem" }} onClick={() => goTo(14)}>Back</button>
        <ValidateTourNext step={step - 1}>Next</ValidateTourNext>
      </div>
    ),
    check: (directives, code, position, index) => {
      const connectStep = studySteps.find(item => item.name === "connect-shorthand")?.check;
      // Check that step exists by 2 frames being present
      // Additionally check that connect is in first frame
      let con = directives.length === 2 && !!connectStep && connectStep(directives.slice(0, 1), code, position, index);
      con = con && directives[1].data.some(line => {
        let con = line?.type === "query" && line?.keyword === "all_nodes";
        const props = line?.properties;
        con = con && !!props?.["background-color"] && props?.["background-color"] === "red";
        con = con && !!props && "label" in props && props["label"] !== undefined && props["label"] !== null && typeof props["label"] === "string" && props["label"].trim().length === 0;
        return con;
      })
      return con;
    }
  },
  {
    name: "render",
    selector: '.snapshots',
    content: ({ inDOM, step, goTo, close }: ReactourStepContentArgs) => {
      // console.log("tour args", args)
      return (
        <div>
          View previews of the frames in your animation here:
          <br />
          <br />
          <button className="button" style={{ marginRight: "0.5rem" }} onClick={() => goTo(15)}>Back</button>
          <ValidateTourNext step={step - 1}>Next</ValidateTourNext>
        </div>
      )
    },
  },
  {
    name: "render",
    selector: '.playback-controls',
    content: ({ inDOM, step, goTo, close }: ReactourStepContentArgs) => {
      // console.log("tour args", args)
      return (
        <div>
          Use the playback controls to play and navigate between frames of your animation.
          <br />
          <br />
          <button className="button" style={{ marginRight: "0.5rem" }} onClick={() => goTo(16)}>Back</button>
          <ValidateTourNext step={step - 1}>Next</ValidateTourNext>
        </div>
      )
    },
  },
  {
    selector: ".docs-view-options",
    content: ({ inDOM, step, goTo, close }: ReactourStepContentArgs) => {
      // console.log("tour args", args)
      return (
        <div>
          There is also a built in info/documentation (docs) section. Feel free to open it to check how a command works or to explore more.
          <br />
          <br />
          Click on one of the &apos;Doc&apos; icons to open the docs window on the right or below your code.
          <br />
          <br />
          <button className="button" style={{ marginRight: "0.5rem" }} onClick={() => goTo(17)}>Back</button>
          <ValidateTourNext step={step - 1}>Next</ValidateTourNext>
        </div>
      )
    },
    check: (directives, code, position, index) => {
      // only check this when on this step
      if (index !== 18) return true;
      return position !== "hidden";
    }
  },
  {
    selector: '.App',
    content: ({ inDOM, step, goTo, close }: ReactourStepContentArgs) => {
      // console.log("tour args", args)
      return (
        <div className="cm-s-material">
          I wonder how you can change the shape of the nodes? Try figuring out how to make the nodes square by looking in the documentation. When you find the command, use it to change the shape of <code>n1</code> to a <code>square</code> for the second frame (animation step).
          <br />
          <br />
          <button className="button" style={{ marginRight: "0.5rem" }} onClick={() => goTo(18)}>Back</button>
          <ValidateTourNext step={step - 1}>Next</ValidateTourNext>
        </div>
      )
    },
    check: (directives, code, position) => {
      let con = true;
      con = con && directives[1].data.some(line => {
        let con = line?.type === "query" && line?.keyword === "union";
        con = con && (line?.parameters?.[0] as any).keyword === "node" && (line?.parameters?.[0] as any).parameters?.[0] === "n1";
        const props = line?.properties;
        con = con && !!props?.["shape"] && props?.["shape"] === "square";
        return con;
      })
      return con;
    }
  },
  {
    selector: '.App',
    content: ({ inDOM, step, goTo, close }: ReactourStepContentArgs) => {
      // console.log("tour args", args)
      return (
        <div className="cm-s-material">
          Great job! Everything that we ask you to do during the study can be accomplished using commands found in the docs.
          <br />
          <br />
          For one more example, try changing the shape of the target arrow shape from <code>n1</code> to <code>n0</code> into a <code>circle</code> in the second frame.
          <br />
          <br />
          <button className="button" style={{ marginRight: "0.5rem" }} onClick={() => goTo(19)}>Back</button>
          <ValidateTourNext step={step - 1}>Next</ValidateTourNext>
        </div>
      )
    },
    check: (directives, code, position) => {
      let con = true;
      con = con && directives[1].data.some(line => {
        const query = line as Grammar.Query;
        let con = true;
        con = con && query?.keyword === "edge" && query?.parameters.length === 3;
        let nodeQuery;
        nodeQuery = (query?.parameters?.[0] as Grammar.Query)?.parameters?.[0] as Grammar.Query;
        con = con && nodeQuery?.keyword === "node" && nodeQuery?.parameters?.[0] === "n1";
        nodeQuery = (query?.parameters?.[2] as Grammar.Query)?.parameters?.[0] as Grammar.Query;
        con = con && nodeQuery?.keyword === "node" && nodeQuery?.parameters?.[0] === "n0";
        const props = line?.properties;
        con = con && !!props?.["target-arrow-shape"] && props?.["target-arrow-shape"] === "circle";
        return con;
      })
      return con;
    }
  },
  {
    selector: ".next-task-button",
    content: ({ inDOM, step, goTo, close }: ReactourStepContentArgs) => {
      // console.log("tour args", args)
      return (
        <div>
          You did it! You made your first graph visualization with ProtoGraph. Would you like to take the tour again, or play around a little on your own before starting the next section of the user study?
          <br />
          <br />
          Otherwise, click 'Start Tasks' to begin.
          <br />
          <br />
          <button className="button" style={{ marginRight: "0.5rem" }} onClick={() => goTo(20)}>Back</button>
          <button className="button" onClick={() => goTo(0)} style={{ marginRight: "0.6rem" }}>Restart Tour</button>
          <button className="button" onClick={() => close()}>Explore</button>
        </div>
      )
    },
  }
  // ...
];

const ConfirmModal: React.FC<{ enter: () => void, onCancel: () => void, buttonText: string }> = ({ enter, buttonText, onCancel }) => {
  return <Modal className="welcome-modal small" onBackdropClick={undefined}>
    <div className="header">
      <h1 className="title">Ready For The Next Step?</h1>
      <br />
      <button className="button" onClick={onCancel} style={{ background: "#263238", marginRight: "0.8rem" }}>Cancel</button>
      <button className="button" onClick={enter}>{buttonText}</button>
    </div>
  </Modal>
}

export const useReporting = (onSuccess: () => void, table: string) => {
  const [errorButtonText, setErrorButtonText] = useState<null | string>(null);
  const { study_id, backup_study_id } = useContext(DocsReportingContext);
  const { code, frames, cy } = useContext(InterfaceContext);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const startDate = useMemo(() => (new Date()).toISOString(), [table]);
  const confirmNextHandler = useCallback(() => {
    if (!table) return;
    setErrorButtonText("Loading...");
    const endDate = (new Date()).toISOString();
    const img = cy?.png();
    supabase.from(table).insert({
      study_id,
      start_at: startDate,
      end_at: endDate,
      duration: differenceInSeconds(parseISO(endDate), parseISO(startDate)),
      code: code,
      previews: frames,
      main_render: img,
      // events: []
    }, {
      returning: "minimal"
    }).then(({ data, error }) => {
      console.log("db insert", data, error);
      if (!error) {
        setErrorButtonText(null);
        onSuccess();
      }
      if (error) {
        console.error("survey insert error", error);
        setErrorButtonText("Error, try again.")
      }
    });
    if (BACKUP_ENABLED) supabaseBackup.from(table).insert({
      study_id : backup_study_id,
      start_at: startDate,
      end_at: endDate,
      duration: differenceInSeconds(parseISO(endDate), parseISO(startDate)),
      code: code,
      previews: frames,
      main_render: img,
      // events: []
    }, {
      returning: "minimal"
    }).then(({ data, error }) => {
      console.log("db insert", data, error);
      if (!error) {
        // setErrorButtonText(null);
        // onSuccess();
      }
      if (error) {
        console.error("survey backup insert error", error);
        // setErrorButtonText("Error, try again.")
      }
    });
  }, [backup_study_id, code, cy, frames, onSuccess, startDate, study_id, table]);
  return { confirmNextHandler, errorButtonText };
};

const ActiveTrainingInner: React.FC<{ onNext: () => void }> = ({ onNext }) => {
  // const [isInfoOpen, setIsInfoOpen] = useState(true);
  const [studyStarted, start] = useStudyState();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const nextHandler = useCallback(() => {
    setConfirmOpen(true);
  }, []);


  const { confirmNextHandler, errorButtonText } = useReporting(onNext, "study_part1_training");
  let buttonText = errorButtonText || "Start Tasks";


  return (
    <>
      <style>
        {`.reactour__close { display: none }`}
      </style>
      <DocsViewProvider>
        {!studyStarted && <InfoModal enter={start as any}></InfoModal>}
        {confirmOpen && <ConfirmModal onCancel={() => setConfirmOpen(false)} buttonText={buttonText} enter={confirmNextHandler}></ConfirmModal>}
        <Tour autoProgress={false} steps={studySteps} rememberUser={false} isTourOpen={true} openOverride={studyStarted && !confirmOpen} onFinish={nextHandler}></Tour>
        <ViewProvider>
          <StudyToolbar onNext={nextHandler} progressText={``} buttonText={buttonText}></StudyToolbar>
          <div className="panels sketch-to-code">
            <div className="editor-pane">
              <CodeMirrorMemo>
                <StatusMessage></StatusMessage>
              </CodeMirrorMemo>
              <Docs showIfPosition="bottom"></Docs>
            </div>
            <RenderPreviewPane showFrames={true} showPlayback={true}>
              <div className="sketch-window">
                <img alt="target-visualization" src={task0Image} />
              </div>
            </RenderPreviewPane>
            <Docs showIfPosition="right" className="floating-right"></Docs>
          </div>
        </ViewProvider>
      </DocsViewProvider>
    </>
  );
}

const ActiveTraining: React.FC<{ onNext: () => void }> = ({ onNext }) => {
  return <InterfaceProvider starterCode={tourStarterCode} saveHandler={() => { }}>
    <ActiveTrainingInner onNext={onNext}></ActiveTrainingInner>
  </InterfaceProvider>
}

export default ActiveTraining;
