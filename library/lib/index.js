import cytoscape from "cytoscape";
import { ParserBuilder } from "./core/Parser";
import { Player } from "./renderer/player";
import { GraphManagerPlayer } from "./renderer/renderer";
var parserBuilder = new ParserBuilder();
export var parser = parserBuilder.generate();
export function protograph(target) {
    var element;
    if (typeof target === "string") {
        element = document.getElementById(target);
    }
    else {
        element = target;
    }
    var player = new Player({
        loop: true,
        frameDuration: 1500,
    });
    var graphPlayer = new GraphManagerPlayer(player, {
        animate_duration: 1000
    });
    var cy = cytoscape({
        container: document.getElementById("hidden-headless-video-graph")
    });
    graphPlayer.init(cy, parser);
}
