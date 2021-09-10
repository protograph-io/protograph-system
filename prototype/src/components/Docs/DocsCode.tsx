import React, { useEffect, useState } from "react";
import Clipboard from 'react-clipboard.js';
import { } from "react-markdown";
import { HighlightedCode } from "../HighlightedCode/HighlightedCode";

export const DocsCode: React.FC<{ code: string }> = ({ code }) => {
    const [copyText, setCopyText] = useState("Copy to Clipboard");

    useEffect(() => {
        if (copyText !== "Copy to Clipboard") {
            window.setTimeout(() => {
                setCopyText("Copy to Clipboard")
            }, 2000)
        }
    }, [copyText]);

    const copySuccess = () => {
        setCopyText("Copied!");
    }

    return <div className="docs-code">
        <HighlightedCode code={code}></HighlightedCode>
        <Clipboard component="p" data-clipboard-text={code} className="docs-code-copy" onSuccess={copySuccess}>{copyText}</Clipboard>
    </div>
}