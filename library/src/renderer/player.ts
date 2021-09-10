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
    skipToFunction: SkipToFunction,
    playNextFunction: PlayNextFunction,
    onEndFunction?: (endIndex: number) => any;
    onStartFunction?: (startIndex: number) => any;
}
export type SkipToFunction = (nextIndex: number) => void;
export type PlayNextFunction = (nextIndex: number) => void;
export class Player {
    protected publishStateHandler: setState<PlayerState> | undefined = undefined;
    public setStateHandler(handler: setState<PlayerState>) {
        this.publishStateHandler = handler;
    }
    protected publishState() {
        this.publishStateHandler && this.publishStateHandler({ ...this.state });
    }
    protected state: PlayerState = {
        nextFrame: 0,
        isPlaying: false,
        numberOfFrames: 0,
    }
    public getState(): PlayerState {
        return { ...this.state };
    }
    public config: PlayerConfig = {
        loop: false,
        frameDuration: 1500,
    }
    public handlers: PlayerHandlers = {
        skipToFunction: (_) => { },
        playNextFunction: (_) => { }
    }
    constructor(config: Partial<PlayerConfig> = {}) {
        this.config = { ...this.config, ...config };
    }
    setFrames(state: Pick<PlayerState, 'numberOfFrames'> & PlayerHandlers) {
        // console.log("RECORDER: playing SET FRAMES");
        (this.currentSetTimeout !== null) && this.onEnd(this.state.nextFrame);
        this.state.nextFrame = 0;
        this.state.numberOfFrames = state.numberOfFrames;
        this.handlers.playNextFunction = state.playNextFunction;
        this.handlers.skipToFunction = state.skipToFunction;
        this.handlers.onStartFunction = state.onStartFunction;
        this.handlers.onEndFunction = state.onEndFunction;
        this.publishState();
    }
    getFrame() {
        return this.state.nextFrame;
    }
    currentSetTimeout: ReturnType<Window["setTimeout"]> | null = null;
    play(until: number | undefined = undefined, callBack?: Function) {
        (this.currentSetTimeout !== null) && this.onEnd(this.state.nextFrame);
        if (this.state.isPlaying) return;
        this.state.isPlaying = true;
        if (this.state.nextFrame === this.state.numberOfFrames) this.state.nextFrame = 0;
        // console.log("RECORDER: play");
        this.onStart(this.state.nextFrame);
        this.playInternal(until, callBack);
        this.publishState();
    }
    protected onStart(startIndex: number) {
        // console.log("RECORDER: pre start");
        return this.handlers?.onStartFunction && this.handlers?.onStartFunction(startIndex);
    }
    protected onEnd(endFrame: number) {
        this.state.isPlaying = false;
        (this.currentSetTimeout !== null) && window.clearTimeout(this.currentSetTimeout);
        // console.log("RECORDER: pre end")
        return this.handlers?.onEndFunction && this.handlers?.onEndFunction(endFrame);
    }
    protected playInternal(until: number | undefined = undefined, callBack?: Function) {
        // Dont continue if not playing
        // console.log("RECORDER: playing internal begin", this.state.isPlaying)
        if (!this.state.isPlaying) return;
        // Play current frame 
        this.handlers.playNextFunction(this.state.nextFrame);
        this.state.nextFrame++;
        this.publishState();
        // console.log("RECORDER: playing internal", this.state.isPlaying)

        // Check if can continue (if at end of limit)
        if (until && this.state.nextFrame >= until) {
            // console.log("RECORDER: playing internal first")
            this.onEnd(this.state.nextFrame - 1);
            callBack && callBack();
            return;
        }
        // Check if can continue (if at end of sequence)
        if (this.state.nextFrame === this.state.numberOfFrames && !this.config.loop) {
            // console.log("RECORDER: playing internal second")
            this.onEnd(this.state.nextFrame - 1);
            callBack && callBack();
            // If end and not looping, then stop
            return;
        } else if (this.state.nextFrame === this.state.numberOfFrames && this.config.loop) {
            // console.log("RECORDER: playing internal last")
            this.state.nextFrame = 0;
        }
        // console.log("RECORDER: playing internal contin", this.config.frameDuration)
        // Go to next
        this.currentSetTimeout = window.setTimeout(() => {
            // console.log("RECORDER: playing internal rerun")
            this.playInternal(until, callBack);
        }, this.config.frameDuration);
        return;
    }
    pause() {
        // console.log("RECORDER: playing PAUSING")
        this.state.isPlaying = false;
        (this.currentSetTimeout !== null) && this.onEnd(this.state.nextFrame);
        this.publishState();
    }
    skipToIfNotThere(frameIndex: number) {
        if (frameIndex === this.state.nextFrame - 1) return;
        this.skipTo(frameIndex);
    }
    skipTo(frameIndex: number) {
        this.state.nextFrame = frameIndex;
        this.handlers.skipToFunction(frameIndex);
        this.state.nextFrame++; // Move to next frame after running skip
        this.publishState();
    }
}