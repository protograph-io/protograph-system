import { ExtensionDocs, ExtensionDocsExtraPage } from 'protograph/lib/core/ExtensionLoader';
import React, { useCallback, useContext, useState } from 'react';
import { BACKUP_ENABLED, DocsReportingContext, supabase, supabaseBackup } from '../../pages/Study';
import { DocsGenerator } from './DocsGenerator';
import { DocsHome } from './DocsHome';
import { DocsPageWrapper } from './DocsPageWrapper';


export type Position = "bottom" | "right" | "hidden";
type PageStack = { link: string, page: React.ReactNode }[];
export type DocsViewContextType = {
    position: Position;
    setPosition: (p:Position) => void,
    docsGenerator: InstanceType<typeof DocsGenerator>,
    pageStack: PageStack,
    addToStack: (link: string) => void,
    goBackTo: (link: string) => void
};
export const defaultDocsViewContext: DocsViewContextType = {
    position: "hidden",
    setPosition: () => undefined,
    docsGenerator: undefined as unknown as InstanceType<typeof DocsGenerator>,
    pageStack: [],
    addToStack: () => { },
    goBackTo: () => { }
};
export const DocsViewContext = React.createContext<DocsViewContextType>(defaultDocsViewContext);

function pageToNode(page: ExtensionDocs | ExtensionDocsExtraPage | null | undefined): React.ReactNode {
    if (page === undefined || page === null) return null;
    return <DocsPageWrapper page={page}></DocsPageWrapper>;
}
function resolvePage(link: string, docsGenerator: DocsGenerator): React.ReactNode | null {
    const docs = docsGenerator.extensionDocs;
    let parts = link.split("/");
    if (!link || parts.length === 1) return <DocsHome></DocsHome>;
    let ext;
    // Find extension if possible
    if (parts.length > 1 && !!parts[1]) {
        ext = docs.find(doc => doc.id === parts[1]);
    }
    // If extension found and example page, find example
    if (ext && parts[0] === "example" && parts.length > 2) {
        const page = ext.extraPages?.find((page: any) => page.hash === parts[2]);
        // Only return page if dependencies are met
        return pageToNode((page && docsGenerator.areDependenciesMet(page.dependencies)) ? page : null);
    }
    if (ext && parts[0] === "style" && parts.length > 2) {
        const page = ext.extraPages?.find((page: any) => page.hash === parts[2]);
        // Only return page if dependencies are met
        return pageToNode((page && docsGenerator.areDependenciesMet(page.dependencies)) ? page : null);
    }
    // If not example, then return extension
    else if (ext) {
        return pageToNode(ext);
    }
    // Else fail
    return null;
}
export const DocsViewProvider: React.FC = ({ children }) => {
    const [home] = useState(<DocsHome></DocsHome>);
    const homeStack = { link: "", page: home };
    const [docsGenerator] = useState(new DocsGenerator());
    const [position, setPosition] = useState<Position>(defaultDocsViewContext.position)
    const [pageStack, setPageStack] = useState<PageStack>([homeStack]);
    // console.log("DOCS VIEW PROVIDER stack", pageStack);

    const { enabled, study_id, backup_study_id, location } = useContext(DocsReportingContext)
    const reportDocsUsage = useCallback((position : Position, pageStack : PageStack, action: string) => {
        if (enabled && study_id && location) {
            supabase.from("study_docs_events").insert({
                study_id,
                page: pageStack[pageStack.length - 1].link,
                location,
                position,
                action
            },{
                returning: "minimal"
            }).then(({ data, error }) => {
                if (error) console.error("docs reporting error", error);
            });
            if (BACKUP_ENABLED) supabaseBackup.from("study_docs_events").insert({
                study_id: backup_study_id,
                page: pageStack[pageStack.length - 1].link,
                location,
                position,
                action
            },{
                returning: "minimal"
            }).then(({ data, error }) => {
                if (error) console.error("docs reporting error", error);
            });
        }
    }, [enabled, study_id, location, backup_study_id])
    const providerValue = {
        position,
        setPosition: (p: Position) => {
            reportDocsUsage(p, pageStack, "position:change");
            setPosition(p);
        },
        docsGenerator,
        pageStack,
        addToStack: (link: string) => {
            // console.log("ADDING TO STACK", link);
            const newPage = resolvePage(link, docsGenerator);
            // console.log("RESOLVED PAGE", newPage);
            if (!newPage) return;
            setPageStack(stack => {
                let newStack = [...stack, { link, page: newPage }];
                reportDocsUsage(position, newStack, "page:add");
                return newStack;
            });
        },
        goBackTo: (link: string) => {
            // console.log("GOING BACK IN STACK", link);
            setPageStack(stack => {
                if (!link.includes("/")) return [homeStack];
                const firstPosition = pageStack.findIndex(({ link: pageLink }) => pageLink === link);
                if (firstPosition === -1) return stack;
                const newStack = [...stack.slice(0, firstPosition + 1)];
                reportDocsUsage(position, newStack, "page:back");
                // console.log("RESOLVED GO BACK", newStack);
                return newStack;
            });
        },
    };

    return (<DocsViewContext.Provider value={providerValue}>{children}</DocsViewContext.Provider>)
}
