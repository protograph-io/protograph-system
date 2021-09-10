import cytoscape from 'cytoscape';
import 'tippy.js/dist/tippy.css';
import { setState } from '../core/types';
import { Core, CoreConfig, OrderedComplete } from '../core/Core';
import { Grammar } from "../grammar/grammar.types";
import { Player } from "./player";
export declare type CytoscapeInstance = ReturnType<typeof cytoscape>;
export declare abstract class GraphManager {
    cy: CytoscapeInstance | undefined;
    core: Core | undefined;
    protected setStatus: setState | undefined;
    abstract init(cy: CytoscapeInstance, parser: PEG.Parser): void;
    abstract enact(directives: Grammar.Animation, setStatus: setState | undefined, ...extras: any[]): void;
    protected run_keyframe(keyframe: Grammar.Keyframe, animate?: boolean): (import("../core/types").EvaluatedParameter | null | undefined)[] | null;
    protected run_command(command: Grammar.Keyframe[number], animate?: boolean, orderedComplete?: OrderedComplete): import("../core/types").EvaluatedParameter | null | undefined;
    reset(): void;
}
export declare class GraphManagerHeadless extends GraphManager {
    init(cy: CytoscapeInstance, parser: PEG.Parser): void;
    enact(directives: Grammar.Animation, setStatus: setState | undefined, setFrames: setState | undefined): void;
    protected run_animation_for_frames(directives: Grammar.Animation): (string | undefined)[];
}
export declare class GraphManagerPlayer extends GraphManager {
    player: Player;
    coreConfig: Partial<CoreConfig>;
    constructor(player: Player, coreConfig?: Partial<CoreConfig>);
    init(cy: CytoscapeInstance, parser: PEG.Parser, main?: boolean): void;
    onDragFreeOn: Function | undefined;
    setOnDragFreeOn(f: (node: cytoscape.NodeSingular, position: cytoscape.Position) => void): void;
    enact(directives: Grammar.Animation, setStatus: setState | undefined, startAtFrame?: number, doPlay?: boolean, setPreview?: setState<string | null> | null | undefined): void;
}
