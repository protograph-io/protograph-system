import * as RecordRTC from "recordrtc";
import { Player, PlayerConfig } from "protograph/lib/renderer/player";

export class Recorder extends Player {
    defaultConfigs: Record<'webm' | 'gif', RecordRTC.Options> = {
        // Working well
        webm: {
            type: 'canvas',
            // frameRate: 60, // No noticable effect 24-120
            // frameInterval: 60, // No noticable effect 24-120
            recorderType: RecordRTC.CanvasRecorder
        },
        // Broken
        gif: {
            type: 'canvas',
            // frameRate: 1000, // higher means slower between frames
            frameRate: 500, // higher means slower between frames
            // frameInterval: 10, //  has micro effect, higher means slower frames
            recorderType: RecordRTC.GifRecorder
        }
    };
    constructor(config: Partial<PlayerConfig> = {}, protected canvas: HTMLCanvasElement) {
        super({ ...{ loop: false }, ...config });
        // console.log("RECOREDR: plugin", this.canvas)
    }
    private recordingActive = false;
    public startRecording(config: RecordRTC.Options) {
        if (this.recordingActive) throw Error("already recording")
        console.log("RECORDER: start")
        this.recordingActive = true;
        //@ts-ignore
        this.recorder = RecordRTC(this.canvas, config);
        this.recorder.startRecording();
    }
    private recorder: any = undefined;
    public stopRecording() {
        console.log("RECORDER: end")
        // Stop and dispose
        if (this.recordingActive) {
            console.log("RECORDER: end begin save", this.recorder, this.recorder.stopRecording)
            this.recorder.stopRecording(() => {
                console.log("RECORDER: end end start save")
                let blob = this.recorder.getBlob();
                RecordRTC.default.invokeSaveAsDialog(blob, "vid");
                console.log("RECORDER: end end save")
                this.recordingActive = false;
                // this.recorder = undefined;
            });
        } else {
            console.log("RECORDER: error")
            throw Error("not recording")
        }
    }
    public record(config: RecordRTC.Options, callback?: Function, until: number | undefined = undefined) {
        if (this.config.loop) throw Error("Cannot record with looping on")
        this.pause()
        this.skipToIfNotThere(0);
        this.startRecording(config);
        console.log("PLAYING WITH DURATION", this.config.frameDuration * 2)
        this.play(until, () => {
            window.setTimeout(() => {
                this.stopRecording();
                callback && callback();
            }, this.config.frameDuration * 2)
        })
    }
}