import { differenceInSeconds, parseISO } from 'date-fns';
import { Grammar } from 'protograph/lib/grammar/grammar.types';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { useEffect } from 'react';
import { useRef } from 'react';
import HamburgerMenu from "react-hamburger-menu";
import ReacTour, { ReactourStepContentArgs } from 'reactour';
import { Docs } from '../../components/Docs/Docs';
import { DocsViewContextType, DocsViewProvider } from '../../components/Docs/DocsContext';
import { CodeMirrorMemo } from '../../components/Editor';
import { GraphRenderMemo } from '../../components/MainRender';
import { Modal } from "../../components/Modal";
import { StatusMessage } from '../../components/StatusMessage';
import { DocsPositionButtonGroup, FullScreenMenu } from '../../components/Toolbar';
import { Tour, tourStarterCode, ValidateTourNext } from '../../components/Tour/Tour';
import { InterfaceContext, InterfaceProvider, setState } from '../../context/InterfaceProvider';
import { pad } from '../../recordSection';
import { BACKUP_ENABLED, DocsReportingContext, supabase, supabaseBackup } from '../Study';
import Draw from './../CodeToSketch/components/Draw/Draw';
export { InterfaceContext };


const useStudyState: () => [boolean, () => void] = () => {
  const [studyStarted, setStudyStarted] = useState<boolean>(false);
  const start = useCallback(() => {
    setStudyStarted(true);
  }, []);
  return [studyStarted, start];
}

const studySteps: (ReacTour["props"]["steps"][number] & { check?: (directives: Grammar.Animation, code: string, docsPosition: DocsViewContextType["position"]) => boolean, name?: string })[] = [
  {
    name: "welcome",
    selector: ".panels",
    // content: "Welcome to ProtoGraph, a tool for rapidly prototyping graph visualizations."
    content: ({ inDOM, step, goTo, close }: ReactourStepContentArgs) => {
      // console.log("tour args", args)
      return (
        <div>
          On the right is the canvas where you will draw the graph using your mouse/keyboard.
          <br />
          <br />
          <button className="button" onClick={() => goTo(step - 1 + 1)}>Start the Tour</button>
        </div>
      )
    },
  },
  {
    name: "welcome",
    selector: ".button-row",
    // content: "Welcome to ProtoGraph, a tool for rapidly prototyping graph visualizations."
    content: ({ inDOM, step, goTo, close }: ReactourStepContentArgs) => {
      // console.log("tour args", args)
      return (
        <div>
          You can use these buttons to draw shapes, lines and curves.
          <br />
          <br />
          <button className="button" style={{ marginRight: "0.5rem" }} onClick={() => goTo(0)}>Back</button>
          <ValidateTourNext step={step - 1}>Next</ValidateTourNext>
        </div>
      )
    },
  },
  {
    name: "welcome",
    selector: ".brush-tool",
    // content: "Welcome to ProtoGraph, a tool for rapidly prototyping graph visualizations."
    content: ({ inDOM, step, goTo, close }: ReactourStepContentArgs) => {
      // console.log("tour args", args)
      return (
        <div>
          The brush tool can be used to draw free or curved edges. This tool is useful for drawing curved edges or self loops (self edges).
          <br />
          <br />
          <button className="button" style={{ marginRight: "0.5rem" }} onClick={() => goTo(0)}>Back</button>
          <ValidateTourNext step={step - 1}>Next</ValidateTourNext>
        </div>
      )
    },
  },
  {
    name: "welcome",
    selector: ".line-tool",
    // content: "Welcome to ProtoGraph, a tool for rapidly prototyping graph visualizations."
    content: ({ inDOM, step, goTo, close }: ReactourStepContentArgs) => {
      // console.log("tour args", args)
      return (
        <div>
          The line tool is useful for drawing straight lines or edges.
          <br />
          <br />
          <button className="button" style={{ marginRight: "0.5rem" }} onClick={() => goTo(0)}>Back</button>
          <ValidateTourNext step={step - 1}>Next</ValidateTourNext>
        </div>
      )
    },
  },
  {
    name: "welcome",
    selector: ".square-tool",
    // content: "Welcome to ProtoGraph, a tool for rapidly prototyping graph visualizations."
    content: ({ inDOM, step, goTo, close }: ReactourStepContentArgs) => {
      // console.log("tour args", args)
      return (
        <div>
          The rectangle tool is useful for drawing squares, rectangles, and boxes.
          <br />
          <br />
          <button className="button" style={{ marginRight: "0.5rem" }} onClick={() => goTo(0)}>Back</button>
          <ValidateTourNext step={step - 1}>Next</ValidateTourNext>
        </div>
      )
    },
  },
  {
    name: "welcome",
    selector: ".ellipse-tool",
    // content: "Welcome to ProtoGraph, a tool for rapidly prototyping graph visualizations."
    content: ({ inDOM, step, goTo, close }: ReactourStepContentArgs) => {
      // console.log("tour args", args)
      return (
        <div>
          The circle tool is useful for drawing nodes/vertices. The tool creates a filled circle with the color you have selected. Make sure to <b>click and drag</b> to set the size of the circle. Also make sure to <b>make your nodes are bigger than your edges</b>, so that they are clearly visible.
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
    selector: '.pointer-tool',
    content: ({ inDOM, step, goTo, close }: ReactourStepContentArgs) => {
      // console.log("tour args", args)
      return (
        <div>
          You can use this arrow buttons to select and drag any object in the canvas
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
    selector: '.trash-tool',
    content: ({ inDOM, step, goTo, close }: ReactourStepContentArgs) => {
      // console.log("tour args", args)
      return (
        <div>
          You can also use the `delete` button to delete any <i>selected</i> objects.
          <br />
          <br />
          <button className="button" style={{ marginRight: "0.5rem" }} onClick={() => goTo(2)}>Back</button>
          <ValidateTourNext step={step - 1}>Next</ValidateTourNext>
        </div>
      )
    },
  },
  {
    name: "render",
    selector: '.text-tool',
    content: ({ inDOM, step, goTo, close }: ReactourStepContentArgs) => {
      // console.log("tour args", args)
      return (
        <div>
          You can click the `text` button to insert text. You can always change any existing text by double clicking on the text.
          <br />
          <br />
          <button className="button" style={{ marginRight: "0.5rem" }} onClick={() => goTo(3)}>Back</button>
          <ValidateTourNext step={step - 1}>Next</ValidateTourNext>
        </div>
      )
    },
  },
  {
    name: "add",
    selector: '.undo-tool',
    // content: 'Lets start by creating your first nodes',
    content: ({ goTo, inDOM, step }: ReactourStepContentArgs) => {
      return (
        <div>
          You can use this `undo` button to undo your actions.
          <br />
          <br />
          <button className="button" style={{ marginRight: "0.5rem" }} onClick={() => goTo(3)}>Back</button>
          <ValidateTourNext step={step - 1}>Next</ValidateTourNext>
        </div>
      )
    },
  },
  {
    name: "render",
    selector: '.brush-colors',
    content: ({ inDOM, step, goTo, close }: ReactourStepContentArgs) => {
      // console.log("tour args", args)
      return (
        <div>
          You can choose any of these available colors *before* drawing any objects for colored objects. Or if you have already drawn some objects, select them with the arrow tool and then click a color to change an object's color.
          <br />
          <br />
          <button className="button" style={{ marginRight: "0.5rem" }} onClick={() => goTo(5)}>Back</button>
          <ValidateTourNext step={step - 1}>Next</ValidateTourNext>
        </div>
      )
    },
  },

  {
    selector: ".next-task-button",
    content: ({ inDOM, step, goTo, close }: ReactourStepContentArgs) => {
      // console.log("tour args", args)
      return (
        <div>
          You did it! You have learned about the sketch interface and you are ready for the next section of the study which will ask you to draw graphs based on ProtoGraph snippets.
          <br />
          <br />
          Would you like to take the tour again, or play around a little on your own before starting the next section of the user study?
          <br />
          <br />
          <button className="button" style={{ marginRight: "0.5rem" }} onClick={() => goTo(6)}>Back</button>
          <button className="button" onClick={() => goTo(0)} style={{ marginRight: "0.6rem" }}>Restart Tour</button>
          <button className="button" onClick={() => close()}>Explore</button>
        </div>
      )
    },
  }
  // ...
];




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
      <h1 className="title">Welcome to Section 2 Training</h1>
      <br />
      <p className="intro">Section 2 of the study focuses on evaluating the readability of the ProtoGraph Language. This section has 3 tasks. For each task, we will give you prewritten ProtoGraph snippets, we ask that you then sketch what you think the graph should look like. Try to make your sketch look like what you expect ProtoGraph to render in the preview pane.
        <br />
        <br />
        This is an opportunity for your to explore the sketch platform. This section is NOT timed, so take your time to experiment and get comfortable with the tool.
      </p>
      <br />
      <br />
      {/* <a href="./" className="button" style={{ background: "#263238", marginRight: "0.8rem" }}>Exit</a> */}
      <button className="button" onClick={enter}>Begin</button>
    </div>
  </Modal>
}


const StudyToolbar: React.FC<{ onNext: () => void, progressText: string, buttonText: string }> = ({ onNext, progressText, buttonText = "Submit Text" }) => {
  const { setIsMobileMenuOpen, isMobileMenuOpen } = useContext(ViewContext);
  return <>
    <FullScreenMenu open={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)}>
      <li ><div className="button button--clear">{progressText}</div></li>
      <li onClick={onNext}><div className="share button">{buttonText}</div></li>
    </FullScreenMenu>
    <div className="toolbar">
      <div className="left">
        <h1 className="brand">ProtoGraph</h1>
        <div className="button button--clear hide-on-mobile-inline-block">{progressText}</div>
      </div>
      <div className="right">
        <DocsPositionButtonGroup></DocsPositionButtonGroup>
        <div className="share button hide-on-mobile-inline-block next-task-button" onClick={onNext}>{buttonText}</div>
        <div className="show-on-mobile-inline-block">
          <HamburgerMenu
            isOpen={isMobileMenuOpen}
            menuClicked={() => setIsMobileMenuOpen(val => !val)}
            width={18}
            height={12}
            strokeWidth={2}
            rotate={0}
            color='white'
            borderRadius={2}
            animationDuration={0.5}
          />
        </div>
      </div>
    </div>
  </>
}




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

const getSketchReporter = (row_id: string | null, prefix: string, sketchRef: any) => {
  let count = 1;
  console.log("get reporter", count, row_id, prefix, sketchRef);
  return () => {
    if (!(prefix && row_id && sketchRef)) return;
    const png = sketchRef.toDataURL({
      format: "png",
      // quality: 0.4
    });
    let partition = count;
    count++;
    // 30 min limit
    if (count > 1000) {
      console.log("count exceeded for sketch snapshot")
      return;
    }
    console.log("uploading ", `sketching/${row_id}/${prefix ? `${prefix}` : 'no-prefix'}/${pad(partition, 8)}.png`)
    supabase.storage
      .from('events')
      .upload(`sketching/${row_id}/${prefix ? `${prefix}` : 'no-prefix'}/${pad(partition, 8)}.png`, png, {
        // cacheControl: 3600,
        upsert: true,
      }).then(({ data, error }) => {
        if (error) console.error("sketching snapshots reporting error", error);
      })
  }
}
const useSketchSnapshots = () => {
  const intervalRef = useRef<number | null>(null);
  const reporter = useRef<null | ReturnType<typeof getSketchReporter>>(null);
  const stop = useCallback(() => {
    if (intervalRef.current) {
      if (reporter.current) reporter.current();
      reporter.current = null;
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);
  const start = useCallback((row_id: string | null, prefix: string, sketchRef: any) => {
    // stop();
    // console.log("useDraw table start", row_id, prefix, sketchRef);
    if (!(prefix && row_id && sketchRef)) return;
    // console.log("useDraw table start pass", row_id, prefix, sketchRef);
    reporter.current = getSketchReporter(row_id, prefix, sketchRef);
    if (!intervalRef.current) intervalRef.current = window.setInterval(() => {
      if (reporter.current) reporter.current();
    }, 2000);
  }, []);
  return { start, stop };
}

export const useDrawReporting = (onSuccess: () => void, sketchRef: any, table: string | null) => {
  // console.log("useDraw table", table);
  const [errorButtonText, setErrorButtonText] = useState<null | string>(null);
  const { study_id, backup_study_id } = useContext(DocsReportingContext);
  const { start, stop } = useSketchSnapshots();
  useEffect(() => {
    // stop();
    // console.log("useDraw table useEffect", table, study_id, sketchRef);
    if (!(table && study_id && !!sketchRef)) return;
    // console.log("useDraw table useEffect pass", table, study_id, sketchRef);
    start(study_id, table, sketchRef);
  }, [sketchRef, start, stop, study_id, table])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const startDate = useMemo(() => (new Date()).toISOString(), [table]);
  const confirmNextHandler = useCallback(() => {
    if (!sketchRef) return;
    if (!table) return;
    stop();
    setErrorButtonText("Loading...");
    const endDate = (new Date()).toISOString();
    const svg = sketchRef._fc.toSVG();
    const png = sketchRef.toDataURL();
    supabase.from(table).insert({
      study_id,
      start_at: startDate,
      end_at: endDate,
      duration: differenceInSeconds(parseISO(endDate), parseISO(startDate)),
      // events: [],
      svg: svg,
      png: png,
      json_export: sketchRef.toJSON(),
    }, {
      returning: "minimal"
    }).then(({ data, error }) => {
      // console.log("db insert", data, error);
      if (!error) {
        setErrorButtonText(null);
        onSuccess();
      }
      if (error) {
        console.error("survey insert error", error);
        setErrorButtonText("Error, try again.")
      }
    });
    supabase.storage
      .from('events')
      .upload(`sketching/${study_id}-prefix-${table}.svg`, svg, {
        // cacheControl: 3600,
        upsert: true,
      }).then(({ data, error }) => {
        if (error) console.error("survey events reporting error", error);
      })
    if (BACKUP_ENABLED) supabaseBackup.from(table).insert({
      study_id: backup_study_id,
      start_at: startDate,
      end_at: endDate,
      duration: differenceInSeconds(parseISO(endDate), parseISO(startDate)),
      // events: [],
      svg: svg,
      png: png,
      json_export: sketchRef.toJSON(),
    }, {
      returning: "minimal"
    }).then(({ data, error }) => {
      // console.log("db insert", data, error);
      if (!error) {
        // setErrorButtonText(null);
        // onSuccess();
      }
      if (error) {
        console.error("survey backup insert error", error);
        // setErrorButtonText("Error, try again.")
      }
    });
  }, [backup_study_id, onSuccess, sketchRef, startDate, stop, study_id, table]);
  return { confirmNextHandler, errorButtonText };
};

const CodeToSketchActiveTrainingInner: React.FC<{ onNext: () => void }> = ({ onNext }) => {

  const [studyStarted, start] = useStudyState();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const nextHandler = useCallback(() => {
    setConfirmOpen(true);
  }, []);
  const afterConfirmNextHandler = useCallback(() => {
    onNext();
  }, [onNext]);

  let buttonText = "Start Tasks";

  const [sketchRef, setSketchRef] = useState<any>(null);
  const { confirmNextHandler, errorButtonText } = useDrawReporting(afterConfirmNextHandler, sketchRef, "study_part2_training");
  if (errorButtonText) buttonText = errorButtonText;

  return (
    <>
      <style>
        {`.reactour__close { display: none }`}
      </style>
      <DocsViewProvider>
        {!studyStarted && <InfoModal enter={start as any}></InfoModal>}
        {confirmOpen && <ConfirmModal onCancel={() => setConfirmOpen(false)} buttonText={buttonText} enter={confirmNextHandler}></ConfirmModal>}
        <Tour autoProgress={false} steps={studySteps} rememberUser={false} isTourOpen={true} openOverride={studyStarted && !confirmOpen} onFinish={() => { }}></Tour>
        <ViewProvider>
          <StudyToolbar onNext={nextHandler} progressText={``} buttonText={buttonText}></StudyToolbar>
          <div className="panels sketch-to-code">
            <div className="editor-pane">
              <CodeMirrorMemo onChange={() => { }} onCursorActivity={() => { }} options={{ readOnly: "nocursor" }}>
                <StatusMessage></StatusMessage>
              </CodeMirrorMemo>
              <Docs showIfPosition="bottom"></Docs>
            </div>
            <div className="render-pane">
              <Draw onNext={() => { }} onBack={() => { }} setRef={setSketchRef}></Draw>
              <div style={{ position: "absolute", top: "100%", left: "100%", visibility: "hidden", opacity: 0 }}>
                <GraphRenderMemo></GraphRenderMemo>
              </div>
            </div>
            <Docs showIfPosition="right" className="floating-right"></Docs>
          </div>
        </ViewProvider>
      </DocsViewProvider>
    </>
  );
}

const CodeToSketchActiveTraining: React.FC<{ onNext: () => void }> = ({ onNext }) => {
  return <InterfaceProvider starterCode={tourStarterCode} saveHandler={() => { }}>
    <CodeToSketchActiveTrainingInner onNext={onNext}></CodeToSketchActiveTrainingInner>
  </InterfaceProvider>
}

export default CodeToSketchActiveTraining;
