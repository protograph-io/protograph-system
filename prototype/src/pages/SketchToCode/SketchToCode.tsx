
import React, { useCallback, useContext, useState } from 'react';
import HamburgerMenu from "react-hamburger-menu";
import { Docs } from '../../components/Docs/Docs';
import { DocsViewProvider } from '../../components/Docs/DocsContext';
import { CodeMirrorMemo } from '../../components/Editor';
import { Modal } from "../../components/Modal";
import { RenderPane } from '../../components/RenderPane';
import { RenderPreviewPane } from '../../components/RenderPreviewPane';
import { StatusMessage } from '../../components/StatusMessage';
import { DocsPositionButtonGroup, FullScreenMenu } from '../../components/Toolbar';
import { tourStarterCode } from '../../components/Tour/Tour';
import InstructionsPanel from '../../components/_study/Instructions';
import { InterfaceContext, InterfaceProvider, setState } from '../../context/InterfaceProvider';
import { useRecordedSection } from '../../recordSection';
import { useReporting } from '../ActiveTraining/ActiveTraining';
import task0Image from "./assets/task0.png";
import task1Image from "./assets/task1.png";
import task2Image from "./assets/task2.png";
import task3Image from "./assets/task3.png";
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
      <h1 className="title">Welcome to Section 1</h1>
      <br />
      <p className="intro">Section 1 of the study focuses on evaluating how quickly someone can learn the ProtoGraph Language and get acquainted with the system. This section has 3 tasks. For each task you will be given an image of a graph that we would like you to recreate in the ProtoGraph System.
        <br />
        <br />
        Do your best to recreate the same graph structure, layout, and styling.
        <br />
        <br />
        This section is timed; please do not leave this tab or walk away from your computer, but do take your time to create an accurate submission.
      </p>
      <br />
      <br />
      {/* <a href="./" className="button" style={{ background: "#263238", marginRight: "0.8rem" }}>Exit</a> */}
      <button className="button" onClick={enter}>Begin</button>
    </div>
  </Modal>
}
const CompletedModal: React.FC<{ onNext: () => void, visible: boolean }> = ({ onNext, visible }) => {
  return <Modal className="welcome-modal small" onBackdropClick={undefined} visible={visible}>
    <div className="header">
      <h1 className="title">Section 1 Complete</h1>
      <br />
      <br />
      <button className="button" onClick={onNext}>Next Section</button>
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
        <div className="share button hide-on-mobile-inline-block" onClick={onNext}>{buttonText}</div>
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


const InstructionsModal: React.FC<{ enter: () => void, instructions: React.ReactNode, number: number }> = ({ enter, instructions, number }) => {
  return <Modal className="welcome-modal small" onBackdropClick={undefined}>
    <div className="header">
      <h1 className="title">Task {number} Instructions</h1>
      <br />
      <p><b>Please read the instructions before starting the task:</b></p>
      <br />
      <p className="intro">{instructions}</p>
      <br />
      <br />
      {/* <a href="./" className="button" style={{ background: "#263238", marginRight: "0.8rem" }}>Exit</a> */}
      <button className="button" onClick={enter}>Begin</button>
    </div>
  </Modal>
}

const tasks = [
  {
    image: task1Image,
    table: "study_part1_task1",
    instructions: <>Use the editor to the left to recreate the top graph with what you have learned. See your graph at the bottom. Do your best to recreate the same graph <b>structure, layout, and styling</b>. <br /><br />Don't forget the <b>node colors</b> (try checking the docs for more info). Don't worry if your graph is rotated or reflected. <b>Do not use the step command; this task should be one frame and not an animation.</b></>
  },
  {
    image: task2Image,
    table: "study_part1_task2",
    instructions: <>Use the editor to the left to recreate the top graph with what you have learned. <b>Notice the code is already started.</b> See your graph at the bottom. Do your best to recreate the same <b>graph structure and styling</b>. Don't forget the <b>node colors, shapes</b>. <br /><br />Notice that the edges in this graph have a direction and there are more than one <b>edge type (arrow shape)</b>. Also notice that the nodes are wider; <b>set the width of all nodes to "70"</b> (try checking the docs for more info). For this task, graph layout matters. Make sure to align <b>LHY and GI</b> horizontally.</>
  },
  {
    image: task3Image,
    table: "study_part1_task3",
    instructions: <>Complete the lower panel to have the frames shown in the top.<br /><br />Notice the code is already started; <b>add steps</b> to create Frame 2, Frame 3, and Frame 4. When setting labels, make sure to use quotation marks around the new label.</>
  }
]

const ConfirmModal: React.FC<{ enter: () => void, onCancel: () => void, buttonText: string, visible: boolean }> = ({ enter, buttonText, onCancel, visible }) => {
  return <Modal className="welcome-modal small" onBackdropClick={undefined} visible={visible}>
    <div className="header">
      <h1 className="title">Ready For The Next Task?</h1>
      <br />
      <button className="button" onClick={onCancel} style={{ background: "#263238", marginRight: "0.8rem" }}>Cancel</button>
      <button className="button" onClick={enter}>{buttonText}</button>
    </div>
  </Modal>
}




const SketchToCodeInner: React.FC<{ onNext: () => void }> = ({ onNext }) => {
  // const [isInfoOpen, setIsInfoOpen] = useState(true);
  const [taskNumber, setTaskNumber] = useState(0); // 0 is tour
  const { setOverrideCode, codeMirrorInstance } = useContext(InterfaceContext);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [instructionsVisible, setInstructionsVisible] = useState(false);
  const nextHandler = useCallback(() => {
    setConfirmOpen(true);
  }, []);
  const afterConfirmNextHandler = useCallback(() => {
    // @ts-ignore
    codeMirrorInstance?.closeHint();
    setTaskNumber(t => {
      setConfirmOpen(false);
      if (t + 1 - 1 <= tasks.length - 1) setInstructionsVisible(true);
      if (t === 0) {
        setOverrideCode(tourStarterCode + "\n"); /// Necessary for react change detection
      } else if (t === 1) {
        setOverrideCode("layout\n\tname: cose\n\nLHY -> CAT3\nLHY -> GI -> LHY -> GBSSI\n\n# Your Code Here\n\n\n\n"); /// Necessary for react change detection
      } else if (t === 2) {
        setOverrideCode(`layout\n\tname : breadthfirst\n\n\nn0 - n1\nn0 - n2\nn1 - n2\nn1 - n3\nn2 - n4\nn3 - n4\n\n\n\n\n`)
      }
      return t + 1;
    });
  }, [setOverrideCode, codeMirrorInstance]);

  let buttonText = "Next Task";
  if (taskNumber > 0) buttonText = "Submit Task";
  if (taskNumber === 3) buttonText = "Finish Section";

  const { confirmNextHandler, errorButtonText } = useReporting(afterConfirmNextHandler, (taskNumber > 0 && taskNumber - 1 <= tasks.length - 1) ? tasks[taskNumber - 1].table : "");
  if (errorButtonText) buttonText = errorButtonText;


  const { onNextHandler } = useRecordedSection("sketchtocode", onNext);



  return (
    <>
      <DocsViewProvider>
        <InfoModal visible={taskNumber === 0} enter={afterConfirmNextHandler}></InfoModal>
        <CompletedModal visible={taskNumber === 4} onNext={onNextHandler}></CompletedModal>
        <ConfirmModal visible={confirmOpen} onCancel={() => setConfirmOpen(false)} buttonText={buttonText} enter={confirmNextHandler}></ConfirmModal>
        {instructionsVisible && <InstructionsModal number={taskNumber} instructions={(taskNumber > 0 && taskNumber - 1 <= tasks.length - 1) ? tasks[taskNumber - 1].instructions : ``} enter={() => setInstructionsVisible(false)}></InstructionsModal>}
        <ViewProvider>
          <StudyToolbar onNext={nextHandler} progressText={taskNumber <= 3 ? `Progress: Task ${taskNumber}/3` : `Complete`} buttonText={buttonText}></StudyToolbar>
          {
            (taskNumber > 0 && taskNumber - 1 <= tasks.length - 1) && <InstructionsPanel key={taskNumber}>
              {tasks[taskNumber - 1].instructions}
            </InstructionsPanel>
          }
          <div className="panels sketch-to-code">
            <div className="editor-pane">
              <h2 className="editor-title">Editor:</h2>
              <CodeMirrorMemo>
                <StatusMessage></StatusMessage>
              </CodeMirrorMemo>
              <Docs showIfPosition="bottom"></Docs>
            </div>
            <RenderPreviewPane showFrames={true} showPlayback={true}>
              <div className="sketch-window">
                {
                  (taskNumber >= 0 && taskNumber - 1 <= tasks.length - 1) && <img alt="target-visualization" src={taskNumber === 0 ? task0Image : tasks[taskNumber - 1].image} />
                }
              </div>
            </RenderPreviewPane>
            <Docs showIfPosition="right" className="floating-right"></Docs>
          </div>
        </ViewProvider>
      </DocsViewProvider>
    </>
  );
}

const SketchToCode: React.FC<{ onNext: () => void }> = ({ onNext }) => {
  return <InterfaceProvider starterCode={tourStarterCode} saveHandler={() => { }}>
    <SketchToCodeInner onNext={onNext}></SketchToCodeInner>
  </InterfaceProvider>
}

export default SketchToCode;
