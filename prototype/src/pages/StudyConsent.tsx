import React, { useCallback, useContext, useState } from 'react';
import { DocsViewProvider } from '../components/Docs/DocsContext';
import { Modal } from "../components/Modal";
import { FullScreenMenu } from '../components/Toolbar';
import { setState } from '../context/InterfaceProvider';
import { BACKUP_ENABLED, DocsReportingContext, supabase, supabaseBackup } from './Study';

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
                {/* <div className="share button hide-on-mobile-inline-block next-task-button" onClick={onNext}>{buttonText}</div> */}
            </div>
        </div>
    </>
}


const DenyModal: React.FC<{ onCancel: () => void }> = ({ onCancel }) => {
    return <Modal className="welcome-modal small" onBackdropClick={undefined}>
        <div className="header">
            <h1 className="title">You have denied consent.</h1>
            <p>As you do not wish to participate in this study, please return your submission on Prolific by selecting the 'Stop without completing' button.</p>
            <br />
            <button className="button" onClick={onCancel} style={{ background: "#263238", marginRight: "0.8rem" }}>Cancel</button>
        </div>
    </Modal>
}

export const StudyConsent: React.FC<{ onNext: () => void, prolificId: string | null }> = ({ onNext, prolificId }) => {
    const [confirmOpen, setConfirmOpen] = useState(false);
    const denyConsent = useCallback(() => {
        setConfirmOpen(true);
    }, []);

    const { study_id, backup_study_id } = useContext(DocsReportingContext);
    const [errorButtonText, setErrorButtonText] = useState<null | string>(null);
    const confirmNextHandler = useCallback((consented: boolean) => {
        setErrorButtonText("Loading...");
        // const endDate = (new Date()).toISOString();

        supabase.from("study_consent").insert({
            study_id,
            prolific_pid: prolificId,
            consented,
        }, {
            returning: "minimal"
        }).then(({ data, error }) => {
            console.log("db insert", data, error);
            if (!error) {
                setErrorButtonText(null);
                consented && onNext();
            }
            if (error) {
                console.error("survey insert error", error);
                setErrorButtonText("Error, try again.")
            }
        });
        if (BACKUP_ENABLED) supabaseBackup.from("study_consent").insert({
            study_id: backup_study_id,
            prolific_pid: prolificId,
            consented,
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
    }, [backup_study_id, onNext, study_id, prolificId]);

    return <>
        <DocsViewProvider>
            {confirmOpen && <DenyModal onCancel={() => setConfirmOpen(false)}></DenyModal>}
            <ViewProvider>
                <StudyToolbar onNext={() => { }} progressText={``} buttonText={``}></StudyToolbar>
                <div style={{ flex: "1 1 auto", minWidth: 0, minHeight: 0, overflow: "auto", display: "flex", justifyContent: "center" }}>
                    <div style={{ flex: '0 1 auto', margin: "auto", minWidth: 0, minHeight: 0, padding: "2rem", maxWidth: "1100px", lineHeight: "1.5" }}>
                        <h1>Welcome to the ProtoGraph Study</h1>
                        <div className="consent-info">

                            <p><b>What is the goal of this study?</b></p>
                            <p>The goal of this study is to look at the usability of ProtoGraph,  a new graph visualization and animation tool. </p>
                            <p><b>Do I qualify for the study?</b></p>
                            <p>Participants in this study are not required to have coding experience, but should be comfortable with the concept of a programming language. </p>
                            <p>If you can complete the training section and successfully complete the trial task, you are qualified for this study!</p>
                            <p><b>What can I expect if I take part in this research? </b></p>
                            <p>Your participation is entirely up to you, and you may stop at any time. If you choose to take part, you will first take part in a 10-15 minute training session on how to use the tool. You will then be asked to correctly complete a single trial task to ensure a basic understanding of the tool. If you complete that task correctly, you will be given a series of tasks for both reading and writing code to generate graphs with Protograph. </p>
                            <p>The survey should take around 60 minutes to finish. If you need more time to finish the survey, you can choose to take longer, but you will be timed out by Prolific after 140 minutes. All information collected will be maintained anonymously. Names and other identifying information, such as IP addresses, will not be saved. </p>
                            <p><b>What should I know about the research study?</b></p>
                            <p>Whether or not you take part is up to you. You can choose not to take part. You can agree to take part and later change your mind. Your decision will not be held against you.</p>
                            <p><b>Who can I talk to?  </b></p>
                            <p>If you have questions, concerns, or a problem, please reach out to:</p>
                            <p>
                                Anonymized
                                <br />
                                Anonymized
                                <br />
                                Anonymized
                            </p>
                        </div>
                        <br />
                        <div className="consent-row">
                            <button className="share consent-button button" onClick={() => { confirmNextHandler(false); denyConsent() }} style={{}}>I do <b>NOT</b> consent to taking part in this study.</button>
                            <button className="share consent-button button" onClick={() => { confirmNextHandler(true) }} style={{}}>I understand the above information and consent to taking part in this study.</button>
                        </div>
                        <br />
                        {!!errorButtonText && errorButtonText}
                        <br />
                        <br />
                    </div>
                </div>
            </ViewProvider>
        </DocsViewProvider>
    </>
}