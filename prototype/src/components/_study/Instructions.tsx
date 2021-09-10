import React from "react"
import { useCallback } from "react";
import { useState } from "react";

export const InstructionsPanel: React.FC<{}> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(true);
    const toggle = useCallback(() => {
        setIsOpen(b => !b);
    }, [])
    return (
        <div className={"instructions-panel " + (isOpen ? " close " : " open ")}>
            <input id="collapsible" className="toggle" type="checkbox" checked={isOpen} onChange={toggle} />
            <label htmlFor="collapsible" className="lbl-toggle"><b>
                Instructions (<span style={{ textDecoration: "underline" }}>click to {isOpen ? "close" : "open"}</span>)</b></label>

            {isOpen && <>
                <br /><br />
                {children}
            </>}
        </div >
    )
}
export default InstructionsPanel;