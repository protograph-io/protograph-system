import { ExtensionDocs, ExtensionDocsExtraPage } from "protograph/lib/core/ExtensionLoader";
import React, { useContext, useState } from "react";
import { CategoryMap } from "./Docs";
import { DocsViewContext } from "./DocsContext";
import { DocsGenerator } from "./DocsGenerator";
import { DocsMarkdown } from "./DocsMarkdown";


export const getCatPages = (cat: keyof typeof CategoryMap, docsGenerator: DocsGenerator, addToStack: (link: string) => void, searchValue: string | null = null) => {
    if (cat === "example" || cat === "style") {
        return docsGenerator.extensionDocs
            .map(ext => ext.extraPages?.filter(item => item.category === cat)
                ?.map((page: any) => ({ ...page, id: ext.id })) || [])
            .flat()
            .filter(page => page.hash && docsGenerator.areDependenciesMet(page.dependencies))
            // Search filter
            .filter(page => !searchValue || (JSON.stringify((page as ExtensionDocsExtraPage)).indexOf(searchValue) !== -1))
            .map(page => {
                const href = `${cat}/${page.id}/${page.hash}`;
                return <li key={href} onClick={() => addToStack(href)}>{page.name}</li>
            });
    }
    return docsGenerator.extensionDocs
        .filter(item => item.category === cat)
        // Search filter
        .filter(page => !searchValue || (JSON.stringify((page as ExtensionDocs)).indexOf(searchValue) !== -1))
        .map(ext => <li key={ext.id} onClick={() => addToStack(`${cat}/${ext.id}`)}>{ext.name}</li>)
}

export const DocsHome: React.FC = () => {
    // const [getRef, setRef] = useDynamicRefs();
    const { docsGenerator, addToStack } = useContext(DocsViewContext);
    const [searchValue, setSearchValue] = useState("");
    return <>
        <div className="docs-wrapper">
            <div className="docs-page docs-home">
                <h1>ProtoGraph Docs</h1>
                <p>Here is an integrated documentation section to help you learn about new features and recall use parts of the ProtoGraph Language.</p>
                <input type="text" className="docs_search" placeholder="Search..." value={searchValue} onChange={e => setSearchValue(e.target.value)}></input>
                <DocsMarkdown markdown={""}></DocsMarkdown>
                {Object.entries(CategoryMap).map(([cat, name]) => {
                    const pages = getCatPages(cat as keyof typeof CategoryMap, docsGenerator, addToStack, searchValue);
                    return !!pages && !!pages.length && <React.Fragment key={cat}>
                        <h2>{name}</h2>
                        <ul>
                            {pages}
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