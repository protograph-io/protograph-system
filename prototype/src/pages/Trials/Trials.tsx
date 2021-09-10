
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Docs } from '../../components/Docs/Docs';
import { DocsViewProvider } from '../../components/Docs/DocsContext';
import { CodeMirrorMemo } from '../../components/Editor';
import { Modal } from "../../components/Modal";
import { RenderPane } from '../../components/RenderPane';
import { RenderPreviewPane } from '../../components/RenderPreviewPane';
import { StatusMessage } from '../../components/StatusMessage';
import { DocsPositionButtonGroup } from '../../components/Toolbar';
import { tourStarterCode } from '../../components/Tour/Tour';
import InstructionsPanel from '../../components/_study/Instructions';
import { InterfaceContext, InterfaceProvider, setState } from '../../context/InterfaceProvider';
import { useRecordedSection } from '../../recordSection';
import { useReporting } from '../ActiveTraining/ActiveTraining';
import trialImage from "./assets/trial-frame1.png";
export { InterfaceContext };

export const existingUserLocalStorageKey = "existing_user";
export const newUser = !localStorage.getItem(existingUserLocalStorageKey);
export function setExistingUser(): void {
  localStorage.setItem(existingUserLocalStorageKey, "true");
}



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

const InfoModal: React.FC<{ enter: () => void, visible: boolean }> = ({ enter, visible }) => {
  return <Modal className="welcome-modal small" onBackdropClick={undefined} visible={visible}>
    <div className="header">
      <h1 className="title">Study Trial</h1>
      <br />
      <p className="intro">This section verifies that you paid attention to the video and tour training. You will need to complete the provided task before you can procede to begin the study. Feel free to use the docs. You are timed, but the main objective is to complete the checklist items successfully.</p>
      <br />
      <br />
      {/* <a href="./" className="button" style={{ background: "#263238", marginRight: "0.8rem" }}>Exit</a> */}
      <button className="button" onClick={enter}>Begin</button>
    </div>
  </Modal>
}

const StudyToolbar: React.FC<{ onNext: () => void, onBack: () => void, progressText: string, buttonText: string }> = ({ onNext, progressText, buttonText = "Submit Text", onBack }) => {
  return <>
    <div className="toolbar">
      <div className="left">
        <h1 className="brand">ProtoGraph</h1>
        <div className="button button--clear">{progressText}</div>
      </div>
      <div className="right">
        <DocsPositionButtonGroup></DocsPositionButtonGroup>
        <div className="share button next-task-button" onClick={onBack}>Back to Tour</div>
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

const ConfirmBackModal: React.FC<{ enter: () => void, onCancel: () => void, buttonText: string, visible: boolean }> = ({ enter, buttonText, onCancel, visible }) => {
  return <Modal className="welcome-modal small" onBackdropClick={undefined} visible={visible}>
    <div className="header">
      <h1 className="title">Go Back to Tour?</h1>
      <p><b>Warning:</b> your progress in this section will be lost and you will have to redo the tour.</p>
      <br />
      <button className="button" onClick={onCancel} style={{ background: "#263238", marginRight: "0.8rem" }}>Cancel</button>
      <button className="button" onClick={enter}>{buttonText}</button>
    </div>
  </Modal>
}

const ConfirmModal: React.FC<{ enter: () => void, onCancel: () => void, buttonText: string, visible: boolean }> = ({ enter, buttonText, onCancel, visible }) => {
  return <Modal className="welcome-modal small" onBackdropClick={undefined} visible={visible}>
    <div className="header">
      <h1 className="title">Ready For The Next Step?</h1>
      <br />
      <button className="button" onClick={onCancel} style={{ background: "#263238", marginRight: "0.8rem" }}>Cancel</button>
      <button className="button" onClick={enter}>{buttonText}</button>
    </div>
  </Modal>
}

const TrialsInner: React.FC<{ onNext: () => void, onBack: () => void }> = ({ onNext, onBack }) => {

  const { lastDirectives, cy } = useContext(InterfaceContext);
  const calcChecks = useCallback(() => {
    const directives = lastDirectives;
    const firstChecks = [
      {
        label: "add 3 nodes (n1, n2, n3)",
        check: (() => {
          let labels = ["n1", "n2", "n3"]
          return cy?.nodes().size() === 3 && labels.every(label => cy.nodes().some(node => node.style("label").trim() === label))
        })()
      },
      {
        label: "set layout to circle", check: directives.some(val => val.data.some(line => {
          if (line?.keyword !== "layout") return false;
          let con = line?.keyword === "layout" && line?.properties && line?.properties.name && line?.properties.name.trim() === "circle";
          return con
        }))
      },
      {
        label: "create edge n1 - n2",
        check: (() => {
          let edge = cy?.edges(`edge[source = "n1"][target = "n2"],edge[source = "n2"][target = "n1"]`);
          return edge?.size() === 1;
        })()
      },
      {
        label: "create edge n2 - n3 and make it solid and blue",
        check: (() => {
          let edge = cy?.edges(`edge[source = "n2"][target = "n3"],edge[source = "n3"][target = "n2"]`);
          return edge?.size() === 1 && edge?.reduce((agg, edge) => {
            return agg && (edge.style("line-color") === "blue" || edge.style("line-color") === "rgb(0,0,255)") && (edge.style("line-style") === "solid" || !edge.style("line-style"))
          }, true)
        })()
      },
      {
        label: "create edge n1 - n3 and make it dashed and green",
        check: (() => {
          let edge = cy?.edges(`edge[source = "n1"][target = "n3"],edge[source = "n3"][target = "n1"]`);
          // console.log("edge check last", edge, edge?.size())
          return edge?.size() === 1 && edge?.reduce((agg, edge) => {
            // console.log("edge check last inner", edge.style("line-color"), edge.style("line-style"))
            return agg && (edge.style("line-color") === "green" || edge.style("line-color") === "rgb(0,128,0)") && (edge.style("line-style") === "dashed")
          }, true)
        })()
      },
    ]
    return firstChecks


  }, [cy, lastDirectives]);
  const [checks, setChecks] = useState(calcChecks());


  useEffect(() => {
    setChecks(calcChecks());
  }, [lastDirectives, cy, calcChecks])

  useEffect(() => {
    const handler = () => setChecks(calcChecks());
    cy?.on("add style position layoutready", handler);
    return () => {
      cy?.removeListener("add style position layoutready", handler);
    }
  }, [calcChecks, cy]);


  // const [isInfoOpen, setIsInfoOpen] = useState(true);
  const [studyStarted, start] = useStudyState();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmBackOpen, setConfirmBackOpen] = useState(false);
  const validContinue = checks.every(item => item.check);
  const nextHandler = useCallback(() => {
    validContinue && setConfirmOpen(true);
  }, [validContinue]);
  
  let buttonText = validContinue ? "Start Study" : "Complete Trial to Continue";
  
  const { onNextHandler } = useRecordedSection("trials",onNext);
  const afterConfirmNextHandler = useCallback(() => {
    validContinue && onNextHandler();
  }, [onNextHandler, validContinue]);
  const { confirmNextHandler, errorButtonText } = useReporting(afterConfirmNextHandler, "study_part1_trials");
  if (errorButtonText) buttonText = errorButtonText;

  return (
    <>
      <style>
        {`.reactour__close { display: none }`}
      </style>
      <DocsViewProvider>
      <InfoModal visible={!studyStarted} enter={start as any}></InfoModal>
        <ConfirmModal  visible={confirmOpen} onCancel={() => setConfirmOpen(false)} buttonText={buttonText} enter={confirmNextHandler}></ConfirmModal>
        <ConfirmBackModal visible={confirmBackOpen} onCancel={() => setConfirmBackOpen(false)} buttonText={"Go Back to Tour"} enter={onBack}></ConfirmBackModal>
        <ViewProvider>
          <StudyToolbar onNext={nextHandler} onBack={() => setConfirmBackOpen(true)} progressText={``} buttonText={buttonText}></StudyToolbar>
          <InstructionsPanel>
            Complete the tasks listed in the goal window. Don't worry about line thickness or graph orientation.
          </InstructionsPanel>
          <div className="panels sketch-to-code">
            <div className="editor-pane">
              <CodeMirrorMemo>
                <StatusMessage></StatusMessage>
              </CodeMirrorMemo>
              <Docs showIfPosition="bottom"></Docs>
            </div>
            <RenderPreviewPane showFrames={true} showPlayback={true}>
              <div className="sketch-window" style={{ display: "flex" }}>
                <div className="trial-instructions" style={{ width: "33%" }}>
                  <br />
                  <br />
                  <h4>Instructions:</h4>
                  <ul>
                    {
                      checks.map((item, index) => <li key={index}><input disabled checked={item.check} type="checkbox" />{item.label}<label></label></li>)
                    }
                  </ul>
                </div>

                <div style={{ width: "66%", height: "auto" }} >
                  <img alt="target-visualization" src={trialImage} />
                </div>
              </div>
            </RenderPreviewPane>
            <Docs showIfPosition="right" className="floating-right"></Docs>
          </div>
        </ViewProvider>
      </DocsViewProvider>
    </>
  );
}



const Trials: React.FC<{ onNext: () => void, onBack: () => void }> = ({ onNext, onBack }) => {
  return <InterfaceProvider starterCode={tourStarterCode} saveHandler={() => { }}>
    <TrialsInner onNext={onNext} onBack={onBack}></TrialsInner>
  </InterfaceProvider>
}

export default Trials;
