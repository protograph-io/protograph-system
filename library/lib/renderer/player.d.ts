import { setState } from "../core/types";
export interface PlayerState {
    nextFrame: number;
    isPlaying: boolean;
    numberOfFrames: number;
}
export interface PlayerConfig {
    loop: boolean;
    frameDuration: number;
}
export interface PlayerHandlers {
    skipToFunction: SkipToFunction;
    playNextFunction: PlayNextFunction;
    onEndFunction?: (endIndex: number) => any;
    onStartFunction?: (startIndex: number) => any;
}
export declare type SkipToFunction = (nextIndex: number) => void;
export declare type PlayNextFunction = (nextIndex: number) => void;
export declare class Player {
    protected publishStateHandler: setState<PlayerState> | undefined;
    setStateHandler(handler: setState<PlayerState>): void;
    protected publishState(): void;
    protected state: PlayerState;
    getState(): PlayerState;
    config: PlayerConfig;
    handlers: PlayerHandlers;
    constructor(config?: Partial<PlayerConfig>);
    setFrames(state: Pick<PlayerState, 'numberOfFrames'> & PlayerHandlers): void;
    getFrame(): number;
    currentSetTimeout: ReturnType<Window["setTimeout"]> | null;
    play(until?: number | undefined, callBack?: Function): void;
    protected onStart(startIndex: number): any;
    protected onEnd(endFrame: number): any;
    protected playInternal(until?: number | undefined, callBack?: Function): void;
    pause(): void;
    skipToIfNotThere(frameIndex: number): void;
    skipTo(frameIndex: number): void;
}
