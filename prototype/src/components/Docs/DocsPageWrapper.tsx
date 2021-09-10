import { useContext } from "react"
import { ExtensionDocs, ExtensionDocsExtraPage } from "protograph/lib/core/ExtensionLoader"
import { CategoryMap } from "./Docs"
import { DocsViewContext } from "./DocsContext"
import { DocsPage } from "./DocsPage"

export const DocsPageWrapper: React.FC<{ page: ExtensionDocs | ExtensionDocsExtraPage }> = ({ page }) => {
    const { goBackTo } = useContext(DocsViewContext)
    return <>
        <div className="docs-wrapper">
            <DocsPage data={page}></DocsPage>
        </div>
        <div className="breadcrumbs">
            <ul className="breadcrumbs-wrapper">
                <li onClick={() => goBackTo("")}>Home</li>
                <li onClick={() => goBackTo(`${CategoryMap[page.category]}`)}>{CategoryMap[page.category]}</li>
                <li onClick={() => { }}>{page.name}</li>
            </ul>
        </div>
    </>
}
