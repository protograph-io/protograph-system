import React, { useCallback, useContext, useState } from 'react';
import ReactPlayer from 'react-player';
import { DocsViewProvider } from '../components/Docs/DocsContext';
import { Modal } from "../components/Modal";
import { FullScreenMenu } from '../components/Toolbar';
import { setState } from '../context/InterfaceProvider';

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
                <div className="share button hide-on-mobile-inline-block next-task-button" onClick={onNext}>{buttonText}</div>
            </div>
        </div>
    </>
}


const ConfirmModal: React.FC<{ enter: () => void, onCancel: () => void, buttonText: string }> = ({ enter, buttonText, onCancel }) => {
    return <Modal className="welcome-modal small" onBackdropClick={undefined}>
        <div className="header">
            <h1 className="title">Ready to start the ProtoGraph Tutorial?</h1>
            <br />
            <button className="button" onClick={onCancel} style={{ background: "#263238", marginRight: "0.8rem" }}>Cancel</button>
            <button className="button" onClick={enter}>{buttonText}</button>
        </div>
    </Modal>
}

export const StudyWelcome: React.FC<{ onNext: () => void }> = ({ onNext }) => {
    const [hasEnded, setHasEnded] = useState(false);
    
    
    const [confirmOpen, setConfirmOpen] = useState(false);
    const nextHandler = useCallback(() => {
        hasEnded && setConfirmOpen(true);
    }, [hasEnded]);

    const onEndedHandle = () => {
        setHasEnded(true);
    }
    const confirmNextHandler = useCallback(() => {
        hasEnded && onNext();
    }, [hasEnded, onNext]);

    let buttonText = hasEnded ? "Begin" : "Watch Video to Begin";

    return <>
        <DocsViewProvider>
            {confirmOpen && <ConfirmModal onCancel={() => setConfirmOpen(false)} buttonText={buttonText} enter={confirmNextHandler}></ConfirmModal>}
            <ViewProvider>
                <StudyToolbar onNext={nextHandler} progressText={``} buttonText={buttonText}></StudyToolbar>
                <div style={{ flex: "1 1 auto", minWidth: 0, minHeight: 0, overflow: "auto", display: "flex", justifyContent: "center"}}>
                    <div style={{ flex: '0 1 auto', margin:"auto", minWidth: 0, minHeight: 0, padding: "2rem", maxWidth: "1100px", lineHeight: "1.5" }}>
                        <h1>Welcome to the ProtoGraph Study</h1>
                        <p>The ProtoGraph System is a set of tools designed to make creating graph (network/node-link) visualizations easier. ProtoGraph presents an English-like language for constructing graph diagrams and animations.</p>
                        <p>Watch the video then click the button in the top right to begin the study.</p>
                        <br />
                        <div className='player-wrapper'>
                            <ReactPlayer
                                width='100%'
                                height='100%'
                                className='react-player'
                                controls={true}
                                onEnded={onEndedHandle}
                                config={{ youtube: { playerVars: { showinfo: 0, modestbranding: 1 } } }}
                                url='https://www.youtube.com/watch?v=4NwjxolhlDk' />
                        </div>
                    </div>
                </div>
            </ViewProvider>
        </DocsViewProvider>
    </>
}