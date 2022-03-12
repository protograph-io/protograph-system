import 'canvas-toBlob/canvas-toBlob.js';
import React, { useContext } from "react";
import HamburgerMenu from "react-hamburger-menu";
import { ViewContext } from "../App";
import { DocsViewContext } from './Docs/DocsContext';

export const FullScreenMenu: React.FC<{ open: boolean, onClose: () => void }> = ({ open, onClose, children }) => {
    return (
        <div className={"fullscreen-menu " + (open ? "open" : "")}>
            <div className="background-text">
                Menu
	</div>
            <ul className="menu">
                {children}
            </ul>
            <button className="close-button button button--clear" type="button" onClick={onClose}>
                <HamburgerMenu
                    isOpen={true}
                    menuClicked={() => onClose()}
                    width={18}
                    height={12}
                    strokeWidth={2}
                    rotate={0}
                    color='white'
                    borderRadius={2}
                    animationDuration={0.5}
                />
            </button>
        </div>
    )
}

export const DocsPositionButtonGroup: React.FC = () => {
    const { position, setPosition } = useContext(DocsViewContext);
    return <div className="hide-on-mobile-inline-flex docs-view-options"><span>Docs:</span> <div className="button-group">
        <button className={"button button--clear " + ((position === "bottom") ? "active" : "")} onClick={(position === "bottom") ? () => setPosition("hidden") : () => setPosition("bottom")}>
            <svg style={{ transform: "rotate(90deg)" }} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-columns"><path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7m0-18H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7m0-18v18"></path></svg>
        </button>
        <button className={"button button--clear " + ((position === "right") ? "active" : "")} onClick={(position === "right") ? () => setPosition("hidden") : () => setPosition("right")}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-columns"><path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7m0-18H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7m0-18v18"></path></svg>
        </button>
        <button className={"button button--clear " + ((position === "hidden") ? "active" : "")} onClick={() => setPosition("hidden")}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-eye-off"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
        </button>
    </div></div>
}

export const Toolbar: React.FC<{ onNew: (() => void) | null | undefined, onShare: () => void }> = ({ onNew, onShare }) => {
    const { setIsMobileMenuOpen, isMobileMenuOpen } = useContext(ViewContext);

    return <>
        <FullScreenMenu open={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)}>
            {
                !!onNew && <li onClick={onNew}><div className="button button--clear" >New</div></li>
            }
            <li onClick={onShare}><div className="share button">Export &amp; Share</div></li>
        </FullScreenMenu>
        <div className="toolbar">
            <div className="left">
                <h1 className="brand">ProtoGraph</h1>
                {
                    !!onNew && <div className="button button--clear hide-on-mobile-inline-block" onClick={onNew}>New</div>
                }
                {
                    <a className="button button--clear hide-on-mobile-inline-block" href={window.location.protocol + '//' + window.location.host + window.location.pathname + `?tour=true`} style={{textDecoration: "none"}}>New with Tour</a>
                }
            </div>
            <div className="right">
                <DocsPositionButtonGroup></DocsPositionButtonGroup>
                <div className="share button hide-on-mobile-inline-block" onClick={onShare}>Export &#47; Share</div>
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