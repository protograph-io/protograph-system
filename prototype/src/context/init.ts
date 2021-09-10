import CodeMirror from 'codemirror';
import cytoscape from 'cytoscape';
import { ParserBuilder } from 'protograph/lib/core/Parser';
import { mode } from '../editor/mode';
import { Player } from "protograph/lib/renderer/player";
import { Recorder } from '../renderer/player';
import { GraphManagerHeadless, GraphManagerPlayer } from "protograph/lib/renderer/renderer";
// TODO: FIX: extensions in library should be able to load extensions for cytoscape but currently can't
let cola = require('cytoscape-cola');
let popper = require('cytoscape-popper');

cytoscape.use(cola); // register extension
cytoscape.use(popper);


//
// Build Parser
//

const parserBuilder = new ParserBuilder();
export const parser = parserBuilder.generate();


//
// Setup CodeMirror Syntax Highlighting
//

parserBuilder.builder.syntaxHighlightingBuilder.setBase(mode)
CodeMirror.defineSimpleMode("simplemode", parserBuilder.generateSyntaxHighlighting());


// 
// Main Render
//

export const player = new Player({
    loop: true,
    frameDuration: 1500,
});
export const graphPlayer = new GraphManagerPlayer(player, {
    animate_duration: 1000
});


//
// Headless Render for Keyframes
//

export const headlessGraph = new GraphManagerHeadless();

 
//
// Recorder (to be removed)
//


const recorderCy = cytoscape({
    container: document.getElementById("hidden-headless-video-graph")
}) as unknown as Parameters<GraphManagerPlayer["init"]>[0];
const recorderCyCanvas: HTMLCanvasElement = document.querySelector("#hidden-headless-video-graph [data-id='layer2-node']") as HTMLCanvasElement;
const canvas = recorderCyCanvas as HTMLCanvasElement;
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
recorderCy.on("render cyCanvas.resize", evt => {
    ctx.globalCompositeOperation = 'destination-over'
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // ctx.restore();
});
const recorder = new Recorder({
    // loop: true,
    frameDuration: 1500,
}, recorderCyCanvas);
export const videoGraph = new GraphManagerPlayer(recorder, {
    animate_duration: 1000
});
videoGraph.init(recorderCy, parser);
