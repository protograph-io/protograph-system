import React, { useContext } from 'react';
import { KeyFrameSnapshotsMemo } from "../components/KeyFrameSnapshots";
import { GraphRenderMemo } from '../components/MainRender';
import { PlaybackControlsConnected } from '../components/PlaybackControls';
import { InterfaceContext } from '../context/InterfaceProvider';

export const RenderPane: React.FC<{ showPlayback: boolean; showFrames: boolean }> = ({ showPlayback, showFrames, children }) => {
  const { playbackState: { numberOfFrames } } = useContext(InterfaceContext);
  return <div className="render-pane">
    {children}
    <GraphRenderMemo></GraphRenderMemo>
    {
      numberOfFrames > 1 &&
      <>
        {showPlayback && <PlaybackControlsConnected></PlaybackControlsConnected>}
        {showFrames && <KeyFrameSnapshotsMemo></KeyFrameSnapshotsMemo>}
      </>
    }
  </div>
}