import React, { useContext } from "react";
import { ExtensionDocs, ExtensionDocsExtraPage } from "protograph/lib/core/ExtensionLoader";
import "./Docs-theme.scss";
import "./Docs.scss";
import { DocsViewContext, DocsViewContextType } from "./DocsContext";

export const CategoryMap: Record<ExtensionDocs["category"] | ExtensionDocsExtraPage["category"], string> = {
    "command": "Commands",
    "object": "Objects",
    "query": "Selectors",
    "style": "Styles",
    "query_constructor": "Constructors",
    "example": "Examples",
}


export const Docs: React.FC<{ showIfPosition: DocsViewContextType["position"], className?: string }> = ({ showIfPosition, className }) => {
    const { position, pageStack } = useContext(DocsViewContext);

    // Helps choose which docs to show based on view setting
    if (position !== showIfPosition) return null;

    return <div className={"docs " + (className || "")}>
        {/* <h1>ProtoGraph Docs</h1>
        <p>Here is an integrated documentation section to help you learn about new features and recall use parts of the ProtoGraph Language.</p>
        <DocsMarkdown markdown={""}></DocsMarkdown> */}
        {/* <div className="docs-container">
            {!!currentPage && <DocsPageWrapper page={currentPage}></DocsPageWrapper>}
        </div> */}
        {pageStack.map(({ link, page },index) => <div key={link + "-" + index} className="docs-container">
            {page}
        </div>)}
    </div>
}