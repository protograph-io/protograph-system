import { differenceInSeconds, parseISO } from 'date-fns';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import HamburgerMenu from "react-hamburger-menu";
import { Docs } from '../../components/Docs/Docs';
import { DocsViewProvider } from '../../components/Docs/DocsContext';
import { CodeMirrorMemo } from '../../components/Editor';
import { GraphRenderMemo } from '../../components/MainRender';
import { Modal } from "../../components/Modal";
import { StatusMessage } from '../../components/StatusMessage';
import { DocsPositionButtonGroup, FullScreenMenu } from '../../components/Toolbar';
import { tourStarterCode } from '../../components/Tour/Tour';
import InstructionsPanel from '../../components/_study/Instructions';
import { InterfaceContext, InterfaceProvider, setState } from '../../context/InterfaceProvider';
import { useDrawReporting } from '../CodeToSketchActiveTraining/CodeToSketchActiveTraining';
import { BACKUP_ENABLED, DocsReportingContext, supabase, supabaseBackup } from '../Study';
import Draw from './components/Draw/Draw';
import task1 from "./tasks/Code1";
import task2 from "./tasks/Code2";
import task4 from "./tasks/Code4";
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

const InfoModal: React.FC<{ enter: () => void }> = ({ enter }) => {
  return <Modal className="welcome-modal small" onBackdropClick={undefined}>
    <div className="header">
      <h1 className="title">Welcome to Section 2</h1>
      <br />
      <p className="intro">Section 2 of the study focuses on evaluating the readability of the ProtoGraph Language. This section has 3 tasks. For each task, we will give you prewritten ProtoGraph snippets, we ask that you then sketch what you think the graph should look like. Try to make your sketch look like what you expect ProtoGraph to render in the preview pane.
        <br />
        <br />
        Your first priority is making sure the graph structure is correct: the correct number of nodes and the appropriate connections/edges. You should also do your best to match the styling you would expect ProtoGraph to render, especially if the snippet specifies a particular style.
        <br />
        <br />
        This section is timed; please do not leave this tab or walk away from your computer, but do take your time to create an accurate sketch.
      </p>
      <br />
      <br />
      {/* <a href="./" className="button" style={{ background: "#263238", marginRight: "0.8rem" }}>Exit</a> */}
      <button className="button" onClick={enter}>Begin</button>
    </div>
  </Modal>
}

const CompletedModal: React.FC<{ onNext: () => void }> = ({ onNext }) => {
  return <Modal className="welcome-modal small" onBackdropClick={undefined}>
    <div className="header">
      <h1 className="title">Section 2 Complete</h1>
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


const tasks = [
  {
    code: task1,
    table: "study_part2_task1",
    instructions: <>Sketch what you think the graph should look like based on the code presented on the left. Try to make your sketch look like what you expect ProtoGraph to render in the preview pane. <b>Make sure that your nodes are bigger than your edges, so that they are clearly visible.</b>
      <br />
      <br />
      Your first priority is making sure the graph structure is correct: the correct number of nodes and the appropriate connections/edges. You should also do your best to match the styling you would expect ProtoGraph to render, especially if the snippet specifies a particular style.
      <br />
      <br />
      <b>Read the entire code before you start drawing. </b>
    </>
  },
  {
    code: task2,
    table: "study_part2_task2",
    instructions: <>Sketch what you think the graph should look like based on the code presented on the left. Try to make your sketch look like what you expect ProtoGraph to render in the preview pane. <b>Make sure that your nodes are bigger than your edges, so that they are clearly visible.</b>
      <br />
      <br />
      Your first priority is making sure the graph structure is correct: the correct number of nodes and the appropriate connections/edges. You should also do your best to match the styling you would expect ProtoGraph to render, especially if the snippet specifies a particular style.
      <br />
      <br />
      <b>Read the entire code before you start drawing. </b> For example, are there any alignment commands that inform graph layout?
    </>
  },
  {
    code: task4,
    table: "study_part2_task3_questions",
    instructions: <>For this task, you will answer some questions about the <b>final frame</b> as specified by the code.</>
  }
]


const ConfirmModal: React.FC<{ enter: () => void, onCancel: () => void, buttonText: string }> = ({ enter, buttonText, onCancel }) => {
  return <Modal className="welcome-modal small" onBackdropClick={undefined}>
    <div className="header">
      <h1 className="title">Ready For The Next Task?</h1>
      <br />
      <button className="button" onClick={onCancel} style={{ background: "#263238", marginRight: "0.8rem" }}>Cancel</button>
      <button className="button" onClick={enter}>{buttonText}</button>
    </div>
  </Modal>
}


const useComprehensionReporting = (onSuccess: () => void, answers: string[], table: string) => {
  const [errorButtonText, setErrorButtonText] = useState<null | string>(null);
  const { study_id, backup_study_id } = useContext(DocsReportingContext);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const startDate = useMemo(() => (new Date()).toISOString(), [table]);
  const confirmNextHandler = useCallback(() => {
    if (!table) return;
    setErrorButtonText("Loading...");
    const endDate = (new Date()).toISOString();
    supabase.from(table).insert({
      study_id,
      start_at: startDate,
      end_at: endDate,
      duration: differenceInSeconds(parseISO(endDate), parseISO(startDate)),
      // events: [],
      answer_1: answers[1 - 1],
      answer_2: answers[2 - 1],
      answer_3: answers[3 - 1],
      answer_4: answers[4 - 1],
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
      study_id: backup_study_id,
      start_at: startDate,
      end_at: endDate,
      duration: differenceInSeconds(parseISO(endDate), parseISO(startDate)),
      // events: [],
      answer_1: answers[1 - 1],
      answer_2: answers[2 - 1],
      answer_3: answers[3 - 1],
      answer_4: answers[4 - 1],
    }, {
      returning: "minimal"
    }).then(({ data, error }) => {
      console.log("db backup insert", data, error);
      if (!error) {
        // setErrorButtonText(null);
        // onSuccess();
      }
      if (error) {
        console.error("survey backup insert error", error);
        // setErrorButtonText("Error, try again.")
      }
    });
  }, [answers, backup_study_id, onSuccess, startDate, study_id, table]);
  return { confirmNextHandler, errorButtonText };
};

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

const CodeToSketchInner: React.FC<{ onNext: () => void }> = ({ onNext }) => {

  const [questions, setQuestions] = useState(["", "", "", ""]);
  const inputHandler = (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    setQuestions(q => {
      q[index] = event.target.value;
      return [...q];
    })
  }
  const questionsAnswered = questions.every(item => item && item !== "");
  // console.log("questions answered", questions, questionsAnswered)


  const [sketchRef, setSketchRef] = useState<any>(null);
  // const [isInfoOpen, setIsInfoOpen] = useState(true);
  const [taskNumber, setTaskNumber] = useState(0); // 0 is tour
  const { setOverrideCode, codeMirrorInstance } = useContext(InterfaceContext);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const nextHandler = useCallback(() => {
    if (taskNumber < 3 || questionsAnswered) setConfirmOpen(true);
  }, [questionsAnswered, taskNumber]);
  const [instructionsVisible, setInstructionsVisible] = useState(false);
  const afterConfirmNextHandler = useCallback(() => {
    if (!(taskNumber < 3 || questionsAnswered)) return;
    // Close autocomplete
    // @ts-ignore
    codeMirrorInstance?.closeHint();
    setConfirmOpen(false);
    setTaskNumber(t => {
      return t + 1;
    });
  }, [questionsAnswered, taskNumber, codeMirrorInstance]);
  useEffect(() => {
    setOverrideCode(tasks[taskNumber - 1]?.code || "");
  }, [setOverrideCode, taskNumber])
  useEffect(() => {
    if (taskNumber > 0 && taskNumber - 1 <= tasks.length - 1) setInstructionsVisible(true);
  }, [setOverrideCode, taskNumber])
  useEffect(() => {
    // @ts-ignore
    codeMirrorInstance?.closeHint();
    sketchRef && sketchRef.clear && sketchRef.clear();
    window.setTimeout(() => {
      // @ts-ignore
      codeMirrorInstance?.closeHint();
    }, 500);
  }, [codeMirrorInstance, sketchRef, taskNumber])

  let buttonText = "Next Task";
  if (taskNumber > 0 && taskNumber < 3) buttonText = "Submit Task";
  else if (taskNumber === 3 && questionsAnswered) buttonText = "Finish Section";
  else buttonText = "Answer All Questions to Continue";

  const { confirmNextHandler: confirmNextHandlerSketch, errorButtonText } = useDrawReporting(afterConfirmNextHandler, sketchRef, (taskNumber > 0 && taskNumber - 1 < tasks.length - 1) ? tasks[taskNumber - 1].table : null);
  const { confirmNextHandler: confirmNextHandlerQuestions, errorButtonText: errorButtonTextQuestions } = useComprehensionReporting(afterConfirmNextHandler, questions, (taskNumber === 3) ? "study_part2_task3_questions" : "");

  if (errorButtonText) buttonText = errorButtonText;
  if (errorButtonTextQuestions) buttonText = errorButtonTextQuestions;


  // Comprehension Questions


  let confirmNextHandler;
  if (taskNumber < 3) confirmNextHandler = confirmNextHandlerSketch;
  else confirmNextHandler = confirmNextHandlerQuestions;

  return (
    <>
      <DocsViewProvider>
        {/* {!studyStarted && <InfoModal enter={start as any}></InfoModal>} */}
        {taskNumber === 0 && <InfoModal enter={afterConfirmNextHandler}></InfoModal>}
        {taskNumber === 4 && <CompletedModal onNext={onNext}></CompletedModal>}
        {instructionsVisible && <InstructionsModal number={taskNumber} instructions={(taskNumber > 0 && taskNumber - 1 <= tasks.length - 1) ? tasks[taskNumber - 1].instructions : ``} enter={() => setInstructionsVisible(false)}></InstructionsModal>}
        {confirmOpen && <ConfirmModal onCancel={() => setConfirmOpen(false)} buttonText={buttonText} enter={confirmNextHandler}></ConfirmModal>}
        <ViewProvider>
          <StudyToolbar onNext={nextHandler} progressText={taskNumber <= 3 ? `Progress: Task ${taskNumber}/3` : `Complete`} buttonText={buttonText}></StudyToolbar>
          {
            (taskNumber > 0 && taskNumber - 1 <= tasks.length - 1) && <InstructionsPanel key={taskNumber}>
              {tasks[taskNumber - 1].instructions}
            </InstructionsPanel>
          }
          <div className="panels">
            <div className="editor-pane">
              <h2 className="editor-title">Editor With Provided Code:</h2>
              <CodeMirrorMemo onChange={() => { }} onCursorActivity={() => { }} options={{ readOnly: "nocursor" }}>
                <StatusMessage></StatusMessage>
              </CodeMirrorMemo>
              <Docs showIfPosition="bottom"></Docs>
            </div>
            <div className="render-pane">
              <div style={{ position: "relative" }} className="draw-window">
                {
                  taskNumber < 3 && <Draw onNext={() => { }} onBack={() => { }} setRef={setSketchRef}></Draw>
                }
                {
                  taskNumber >= 3 && <div className="comprehension-questions">
                    <div className="question">
                      <label htmlFor="question-1">How many animation frames are present in the code, including the starting frame?</label>
                      <input name="question-1" value={questions[1 - 1]} onChange={(event) => inputHandler(event, 1 - 1)} type="text" placeholder="Your answer goes here..." />
                    </div>
                    <div className="question">
                      <label htmlFor="question-2">What is the style of the edge n1 - n2 in the 3rd frame?</label>
                      <input name="question-2" value={questions[2 - 1]} onChange={(event) => inputHandler(event, 2 - 1)} type="text" placeholder="Your answer goes here..." />
                    </div>
                    <div className="question">
                      <label htmlFor="question-3">What are all colors that n1 has throughout the animation?</label>
                      <input name="question-3" value={questions[3 - 1]} onChange={(event) => inputHandler(event, 3 - 1)} type="text" placeholder="Your answer goes here..." />
                    </div>

                    <div className="question">
                      <label htmlFor="question-4">How many nodes are in the final graph (the last frame)?</label>
                      <input name="question-4" value={questions[4 - 1]} onChange={(event) => inputHandler(event, 4 - 1)} type="text" placeholder="Your answer goes here..." />
                    </div>
                  </div>
                }
                <div style={{ position: "absolute", top: "100%", left: "100%", visibility: "hidden", opacity: 0 }}>
                  <GraphRenderMemo></GraphRenderMemo>
                </div>
              </div>
            </div>
            <Docs showIfPosition="right" className="floating-right"></Docs>
          </div>
        </ViewProvider>
      </DocsViewProvider>
    </>
  );
}

const CodeToSketch: React.FC<{ onNext: () => void }> = ({ onNext }) => {
  return <InterfaceProvider starterCode={tourStarterCode} saveHandler={() => { }}>
    <CodeToSketchInner onNext={onNext}></CodeToSketchInner>
  </InterfaceProvider>
}

export default CodeToSketch;
