import React, { useContext, useMemo } from 'react';
import { InterfaceContext } from '../App';
import { logStateChange } from '../core/helpers';

export const KeyFrameSnapshots: React.FC<{ images: string[] }> = ({ images }) => {
    logStateChange("rerunning frames inside")

    return (
        <div className="snapshots">
            {
                images.map((img, i) =>
                    <div key={i} className="snapshots_frame">
                        <img src={img} alt="" className="snapshots_frame_image" />
                    </div>)
            }
        </div>
    );
}

export const KeyFrameSnapshotsMemo: React.FC = () => {
    let { frames } = useContext(InterfaceContext);
    logStateChange("rerunning frames memo")

    return useMemo(() => {
        // The rest of your rendering logic
        return <KeyFrameSnapshots images={frames} />;
    }, [frames])
}