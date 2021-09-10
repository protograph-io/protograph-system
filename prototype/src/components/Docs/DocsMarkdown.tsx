import React, { useContext } from "react";
import ReactMarkdown from "react-markdown";
import { DocsCode } from "./DocsCode";
import { DocsViewContext } from "./DocsContext";
import gfm from 'remark-gfm';

export const DocsMarkdown: React.FC<{ markdown: string }> = ({ markdown }) => {
    const { addToStack } = useContext(DocsViewContext);
    return <ReactMarkdown remarkPlugins={[gfm]} components={{ 
        code: (props) => {
            if (!props.className || (props.className as string).toLowerCase().includes("protograph")) {
                return <DocsCode code={props.children.toString().trim()}></DocsCode>
            }
            return <div className="pre-inner">
                {props.children}
            </div>
        },
        a: ({ href, children }) => {
            return <a href="#" onClick={() => addToStack(href as string)}>{children}</a>
            // return "a";
        }
    }} children={markdown} />
}