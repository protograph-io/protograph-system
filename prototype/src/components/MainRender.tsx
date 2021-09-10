import React, { useContext, useMemo } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import { InterfaceContext } from '../App';
import { logStateChange } from '../core/helpers';
import { CytoscapeInstance } from 'protograph/lib/renderer/renderer';


const GraphRender: React.FC<{ className: any, setRef: (cy: CytoscapeInstance) => void }> = ({ className, setRef }) => {
    logStateChange("rerending main render react inner element");
    return <CytoscapeComponent className={className} elements={[]} style={{}} cy={(cy) => { setRef(cy as unknown as CytoscapeInstance) }} />;
}
export const GraphRenderMemo = React.memo(function WrappedComponent(_: any) {
    const { setCy } = useContext(InterfaceContext);
    logStateChange("rerending main render react memo wrapper");

    const cytoscapeSetRef = (cy: CytoscapeInstance) => {
        setCy(cy);
    }

    // Only needs to render once
    return useMemo(() => {
        return <GraphRender className="graph-render" setRef={cytoscapeSetRef}></GraphRender>

        // Empty dependency to prevent rerender
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
});