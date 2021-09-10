import cytoscape from "cytoscape";
import { ParserBuilder } from "./core/Parser";
import { Player } from "./renderer/player";
import { GraphManagerPlayer } from "./renderer/renderer";

const parserBuilder = new ParserBuilder();
export const parser = parserBuilder.generate();

export function protograph(target : string | HTMLCanvasElement) {
    let element;
    if (typeof target === "string") {
        element = document.getElementById(target);
    } else {
        element = target;
    }
    const player = new Player({
        loop: true,
        frameDuration: 1500,
    });
    const graphPlayer = new GraphManagerPlayer(player, {
        animate_duration: 1000
    });
    const cy = cytoscape({
        container: document.getElementById("hidden-headless-video-graph")
    })
    graphPlayer.init(cy, parser);
    
}