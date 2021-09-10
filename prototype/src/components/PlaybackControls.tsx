import React, { useContext } from 'react';
import { InterfaceContext } from '../App';

const Pause: React.FC<any> = ({ onPlayerClick }) => {
    return (
        <svg className="" viewBox="0 0 60 60" onClick={onPlayerClick}>
            <polygon points="0,0 15,0 15,60 0,60" />
            <polygon points="25,0 40,0 40,60 25,60" />
        </svg>
    )
}

const Play: React.FC<any> = ({ onPlayerClick }) => {
    return (
        <svg className="" viewBox="0 0 60 60" onClick={onPlayerClick}>
            <polygon points="0,0 50,30 0,60" />
        </svg>
    )
}
const PlayPause: React.FC<any> = ({ isPlaying, handlePlayerClick }) => {
    return (
        <div className="player" >
            {isPlaying ? <Pause onPlayerClick={handlePlayerClick} /> : <Play onPlayerClick={handlePlayerClick} />}
        </div>
    )
}


export interface PlaybackControlsProps {
    config: {
        isPlaying: boolean,
        handlePlayPauseClick: () => void,
        currentFrame: number;
        numberOfFrames: number;
        frameDuration: number;
        tickClick: (index : number) => void
    }
}
export const PlaybackControls: React.FC<PlaybackControlsProps> = ({ config: { isPlaying, handlePlayPauseClick, currentFrame, numberOfFrames, frameDuration, tickClick } }) => {
    return <div className="playback-controls">
        <div className="playback-controls_playpause">
            <PlayPause isPlaying={isPlaying} handlePlayerClick={handlePlayPauseClick}></PlayPause>

        </div>
        <div className="playback-controls_track">
            {Array(numberOfFrames).fill(0).map((_,i,arr) =>
                <div key={i} className={"playback-controls_track_tick" + (i===arr.length-1 ? " playback-controls_track_tick--last" : "")} onClick={() => tickClick(i)}></div>
            )}
            {/* TODO: Investigate; currentframe is 0 before first scene is rendered which makes it off screen to the left */}
            <div className="playback-controls_track_tick--status" style={{
                left: `${(Math.max(currentFrame - 1, 0)) / (numberOfFrames - 1) * 100}%`,
                transition: `all ${frameDuration / 1000}s`
            }}>
                {/* https://github.com/encharm/Font-Awesome-SVG-PNG/blob/master/black/svg/caret-up.svg?short_path=9c8e788 */}
                <svg width="1792" height="1792" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M1408 1216q0 26-19 45t-45 19h-896q-26 0-45-19t-19-45 19-45l448-448q19-19 45-19t45 19l448 448q19 19 19 45z" /></svg>
            </div>
        </div>
        <div className="playback-controls_position">
            {currentFrame}/{numberOfFrames}
        </div>
    </div>
}
export const PlaybackControlsConnected: React.FC<{}> = () => {
    const {playbackState: {isPlaying, nextFrame, numberOfFrames}, player} = useContext(InterfaceContext);
    return <PlaybackControls config={{
        isPlaying,
        currentFrame: nextFrame,
        numberOfFrames,
        frameDuration: player.config.frameDuration,
        handlePlayPauseClick: () => {
            if (isPlaying) {
                player.pause()
            } else {
                player.play()
            }
        },
        tickClick: (index) => {
            player.pause();
            player.skipTo(index);
        }
    }}></PlaybackControls>
}