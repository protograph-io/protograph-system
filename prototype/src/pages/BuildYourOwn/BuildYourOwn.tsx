
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
import InstructionsPanel from '../../components/_study/Instructions';
import { InterfaceContext, InterfaceProvider, setState } from '../../context/InterfaceProvider';
import { useRecordedSection } from '../../recordSection';
import { useReporting } from '../ActiveTraining/ActiveTraining';
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
      <h1 className="title">Welcome to Section 3</h1>
      <br />
      <p className="intro">Section 3 is where you get to show off what you have learned and make your own graph with the ProtoGraph system. If you work with graphs in your job or your classes, make a graph that you would use in this context; otherwise make any graph you would like.
        <br />
        <br />
        We are excited to see what you would use ProtoGraph for!
      </p>
      <br />
      <br />
      <button className="button" onClick={enter}>Begin</button>
    </div>
  </Modal>
}
const CompletedModal: React.FC<{ onNext: () => void, visible: boolean }> = ({ onNext, visible }) => {
  return <Modal className="welcome-modal small" onBackdropClick={undefined} visible={visible}>
    <div className="header">
      <h1 className="title">Section 3 Complete</h1>
      <br />
      <br />
      <button className="button" onClick={onNext}>Proceed to Final Section</button>
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

const ConfirmModal: React.FC<{ enter: () => void, onCancel: () => void, buttonText: string, visible: boolean }> = ({ enter, buttonText, onCancel, visible }) => {
  return <Modal className="welcome-modal small" onBackdropClick={undefined} visible={visible}>
    <div className="header">
      <h1 className="title">Ready to Submit Your Visualization?</h1>
      <br />
      <button className="button" onClick={onCancel} style={{ background: "#263238", marginRight: "0.8rem" }}>Cancel</button>
      <button className="button" onClick={enter}>{buttonText}</button>
    </div>
  </Modal>
}

const SketchToCodeInner: React.FC<{ onNext: () => void }> = ({ onNext }) => {
  // const [isInfoOpen, setIsInfoOpen] = useState(true);
  const [taskNumber, setTaskNumber] = useState(0); // 0 is tour
  // const { setOverrideCode } = useContext(InterfaceContext);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const nextHandler = useCallback(() => {
    setConfirmOpen(true);
  }, []);
  const afterConfirmNextHandler = useCallback(() => {
    setTaskNumber(t => {
      setConfirmOpen(false);
      // if (t === 0 || t === 1) {
      //   setOverrideCode(tourStarterCode + "\n "); /// Necessary for react change detection
      // } else if (t === 2) {
      //   setOverrideCode(`layout\n\tanimate : false\n\tname : breadthfirst\n\n0 - 1\n0 - 2\n1 - 2\n1 - 3\n2 - 4\n3 - 4\n\n`)
      // }
      return t + 1;
    });
  }, []);

  let buttonText = "Next Task";
  if (taskNumber > 0) buttonText = "Submit Task";
  if (taskNumber === 1) buttonText = "Submit Visualization";

  const {confirmNextHandler, errorButtonText} = useReporting(afterConfirmNextHandler, "study_part3"); 
  if (errorButtonText) buttonText = errorButtonText;
  const { onNextHandler } = useRecordedSection("buildyourown",onNext);


  return (
    <>
      <DocsViewProvider>
        <InfoModal visible={taskNumber === 0} enter={afterConfirmNextHandler}></InfoModal>
        <CompletedModal visible={taskNumber === 2} onNext={onNextHandler}></CompletedModal>
        <ConfirmModal visible={confirmOpen} onCancel={() => setConfirmOpen(false)} buttonText={buttonText} enter={confirmNextHandler}></ConfirmModal>
        <ViewProvider>
          <StudyToolbar onNext={nextHandler} progressText={``} buttonText={buttonText}></StudyToolbar>
          <InstructionsPanel>
            Show what you have learned in the study and design your own graph. Start adding your code in line 4.
          </InstructionsPanel>
          <div className="panels sketch-to-code">
            <div className="editor-pane">
              <h2 className="editor-title">Editor:</h2>
              <CodeMirrorMemo>
                <StatusMessage></StatusMessage>
              </CodeMirrorMemo>
              <Docs showIfPosition="bottom"></Docs>
            </div>
            <RenderPreviewPane showFrames={true} showPlayback={true}>
            </RenderPreviewPane>
            <Docs showIfPosition="right" className="floating-right"></Docs>
          </div>
        </ViewProvider>
      </DocsViewProvider>
    </>
  );
}

const starterCode = `layout\n\tname: breadthfirst\n\n# Add your code below this line: \n\n\n\n\n\n\n/* Optionally, if your graph represents something, such as your friend network, let us know below (before the end of the comment): \n\n\n\n # End of Comment (Respond Above)*/\n\n`;
const SketchToCode: React.FC<{ onNext: () => void }> = ({ onNext }) => {
  return <InterfaceProvider starterCode={starterCode} saveHandler={() => { }}>
    <SketchToCodeInner onNext={onNext}></SketchToCodeInner>
  </InterfaceProvider>
}

export default SketchToCode;
