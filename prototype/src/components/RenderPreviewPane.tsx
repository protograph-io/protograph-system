import React, { useContext } from 'react';
import { KeyFrameSnapshotsMemo } from "../components/KeyFrameSnapshots";
import { GraphRenderMemo } from '../components/MainRender';
import { PlaybackControlsConnected } from '../components/PlaybackControls';
import { InterfaceContext } from '../context/InterfaceProvider';

export const RenderPreviewPane: React.FC<{ showPlayback: boolean; showFrames: boolean }> = ({ showPlayback, showFrames, children }) => {
  const { playbackState: { numberOfFrames }, preview } = useContext(InterfaceContext);
  return <div className="render-pane">
    {children}
    {/* Todo remove */}
    <div className="" style={{height: "10px", flex: "1 1 auto", position: "relative"}}>
      <div className="" style={{position:"absolute", top: "10px", left: "10px", bottom: "10px", right: "10px", width: "auto !important", height: "auto !important", backgroundImage: `url(${preview})`, backgroundSize: "contain", backgroundPosition: "center", backgroundRepeat: "no-repeat"}}> 
      </div>
      <div style={{visibility: "hidden", display: "flex", flexDirection: "column", width: "100%", height: "100%"}}>
        <GraphRenderMemo></GraphRenderMemo>
      </div>
    </div>
    {
      numberOfFrames > 1 &&
      <>
        {showPlayback && <PlaybackControlsConnected></PlaybackControlsConnected>}
        {showFrames && <KeyFrameSnapshotsMemo></KeyFrameSnapshotsMemo>}
      </>
    }
  </div>
}