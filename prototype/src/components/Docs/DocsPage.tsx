import React from "react";
import { ExtensionDocs, ExtensionDocsExtraPage } from "protograph/lib/core/ExtensionLoader";
import { DocsCode } from "./DocsCode";
import { DocsMarkdown } from "./DocsMarkdown";



export const DocsPage: React.FC<{ data: ExtensionDocs | ExtensionDocsExtraPage }> = ({ data: { name, description, keywords, category, image, usage } }) => {
    return <div className="docs-page">
        <h1 className="title">{name}</h1>
        {/* <h2 className="subtitle">{CategoryMap[category]}</h2> */}
        {<DocsMarkdown markdown={description.toString()}></DocsMarkdown>}
        {!!image && <img src={image} alt="" />}
        {
            usage && usage.length && usage?.map(example => <>
                <h2>Example: {example.name}</h2>
                {!!example.description && <DocsMarkdown markdown={example.description}></DocsMarkdown>}
                {!!example.image && <img src={example.image} alt="" />}
                {!!example.codeExample && <DocsCode code={example.codeExample} />}
            </>) 
        }
    </div>
}