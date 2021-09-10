import React, { useContext } from "react";
import { CategoryMap } from "./Docs";
import { DocsViewContext } from "./DocsContext";
import { DocsGenerator } from "./DocsGenerator";
import { DocsMarkdown } from "./DocsMarkdown";


export const getCatPages = (cat: keyof typeof CategoryMap, docsGenerator: DocsGenerator, addToStack: (link: string) => void) => {
    if (cat === "example" || cat === "style") {
        return docsGenerator.extensionDocs.map(ext => ext.extraPages?.filter(item => item.category === cat)?.map((page:any) => ({ ...page, id: ext.id })) || []).flat().filter(page => page.hash && docsGenerator.areDependenciesMet(page.dependencies)).map(page => {
            const href = `${cat}/${page.id}/${page.hash}`;
            return <li key={href} onClick={() => addToStack(href)}>{page.name}</li>
        });
    }
    return docsGenerator.extensionDocs.filter(item => item.category === cat).map(ext => <li key={ext.id} onClick={() => addToStack(`${cat}/${ext.id}`)}>{ext.name}</li>)
}

export const DocsHome: React.FC = () => {
    // const [getRef, setRef] = useDynamicRefs();
    const { docsGenerator, addToStack } = useContext(DocsViewContext);
    return <>
        <div className="docs-wrapper">
            <div className="docs-page docs-home">
                <h1>ProtoGraph Docs</h1>
                <p>Here is an integrated documentation section to help you learn about new features and recall use parts of the ProtoGraph Language.</p>
                <DocsMarkdown markdown={""}></DocsMarkdown>
                {Object.entries(CategoryMap).map(([cat, name]) => {
                    const pages = getCatPages(cat as keyof typeof CategoryMap, docsGenerator, addToStack);
                    return !!pages && !!pages.length && <React.Fragment key={cat}>
                        <h2>{name}</h2>
                        <ul>
                            {getCatPages(cat as keyof typeof CategoryMap, docsGenerator, addToStack)}
                        </ul>
                    </React.Fragment>
                })}
            </div >
        </div>
        <div className="breadcrumbs">
            <ul className="breadcrumbs-wrapper">
                <li onClick={() => { }}>Home</li>
            </ul>
        </div>
    </>
}