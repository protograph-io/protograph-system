import cytoscape from 'cytoscape';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import { debounce } from '../core/helpers';
import { setState } from '../core/types';
import { Core, CoreConfig, OrderedComplete } from '../core/Core';
import { Grammar } from "../grammar/grammar.types";
import { Player } from "./player";
let popper = require('cytoscape-popper');
export type CytoscapeInstance = ReturnType<typeof cytoscape>;

cytoscape.use(popper);

/**
 * The renders are really managers that associate the core instance with a cytoscape instance. They also run cytoscape batch and resets.
 * They also incorporate a player if applicable
 */

export abstract class GraphManager {
    cy: CytoscapeInstance | undefined = undefined;
    core: Core | undefined = undefined;

    protected setStatus: setState | undefined;

    abstract init(cy: CytoscapeInstance, parser: PEG.Parser): void;
    abstract enact(directives: Grammar.Animation, setStatus: setState | undefined, ...extras: any[]): void;
    // protected abstract run_animation_for_frames(directives: Grammar.Animation) : void;

    protected run_keyframe(keyframe: Grammar.Keyframe, animate: boolean = true) {

        if (!keyframe) return null;

        const orderedComplete = new OrderedComplete(keyframe.length);

        const res = keyframe.map((command, i) => this.run_command(command, animate, orderedComplete));
        try {
            this.core?.update();
            return res;
        } catch (error) {
            console.log("Error Evaluating Code Update", error);
            this.setStatus && this.setStatus({ status: "error", message: "Unsupported Line" });
        }

        return res;
    }

    protected run_command(command: Grammar.Keyframe[number], animate: boolean = true, orderedComplete?: OrderedComplete) {
        // Eager evaluate parameters before passing to command handler
        try {
            const res = this.core?.evaluate(command, undefined, true, animate, orderedComplete);
            return res;
        } catch (error) {
            console.log("Error Evaluating Code", error);
            this.setStatus && this.setStatus({ status: "error", message: "Unsupported Line" });
        }
        return null;
    }
    reset() {
        this.core?.cy?.elements().remove();
        this.core?.reset();
    }
}

export class GraphManagerHeadless extends GraphManager {
    public init(cy: CytoscapeInstance, parser: PEG.Parser) {
        this.cy = cytoscape({
            container: document.getElementById("hidden-headless-graph")
        });;
        this.core = new Core(this.cy, parser, { animate_duration: 0 });
    }
    public enact(directives: Grammar.Animation, setStatus: setState | undefined, setFrames: setState | undefined) {
        this.setStatus = setStatus;
        // Place timing and playback here
        // setStatus && setStatus({status: "success", message: "Loading..."})
        const frames = this.run_animation_for_frames(directives);
        setFrames && setFrames([...frames] || [])
    }
    protected run_animation_for_frames(directives: Grammar.Animation) {
        this.cy?.startBatch();
        this.reset();
        this.cy?.endBatch();
        const frames = directives.map(({ data: keyframe }) => {
            this.cy?.startBatch();
            this.run_keyframe(keyframe, false)
            // Hides labels in snapshots 
            this.cy?.$("[label]").style({ label: null });
            this.cy?.endBatch();
            const res = this.cy?.png({
                scale: 4,
            });
            return res;
        });
        // this.headlessCy.startBatch();
        // this.reset();
        // this.headlessCy.endBatch();
        return frames;
    }
}

const debouncedDragFree = debounce((event : cytoscape.EventObject, onDragFreeOn : any) => {
    const node = (event.target as cytoscape.NodeSingular);
    !!onDragFreeOn && onDragFreeOn(node, event.target._private.position)
}, 100);
export class GraphManagerPlayer extends GraphManager {
    public coreConfig: Partial<CoreConfig> = {};
    constructor(public player: Player, coreConfig: Partial<CoreConfig> = {}) {
        super();
        this.coreConfig = coreConfig;
    }
    init(cy: CytoscapeInstance, parser: PEG.Parser, main = false) {
        this.cy = cy;
        this.core = new Core(cy, parser, this.coreConfig);

        // Tooltip on hover for elements

        if (main) cy.on('mouseover', (event: any) => {
            // console.log("MOUSEOVER", event, event.target)

            if (event.target.scratch("tip") !== undefined) return;
            // https://github.com/cytoscape/cytoscape.js-popper
            let ele = event.target;
            const id = ele?._private?.data?.id;
            if (id === undefined) return;
            let ref = (ele as any).popperRef(); // used only for positioning
            let dummyDomEle = document.createElement('div');
            dummyDomEle.style.display = "none";
            dummyDomEle.style.opacity = "0";
            dummyDomEle.style.position = "relative";
            dummyDomEle.style.zIndex = "-1";

            // @ts-ignore
            let tip = new tippy(dummyDomEle, {
                getReferenceClientRect: ref.getBoundingClientRect,
                trigger: 'manual',
                content: () => {
                    let content = document.createElement('div');

                    content.innerHTML = `(${ele._private.group}) id: ${ele._private.data.id}`

                    return content;
                }
            });

            tip.show();
            event.target.scratch("tip", tip);
        });


        if (main) cy.on('dragfreeon', "node", (ev) => {
            debouncedDragFree(ev, this.onDragFreeOn);
        });
        // // Updated on layout too
        // cy.on('position', (event) => console.log("position", event));

        if (main) cy.on('mouseout', (event: any) => {
            const tip = event.target.scratch("tip");
            event.target.removeScratch("tip");
            if (tip) {
                tip.destroy();
            }
        });
    }
    onDragFreeOn: Function | undefined = undefined;
    setOnDragFreeOn(f: (node: cytoscape.NodeSingular, position: cytoscape.Position) => void) {
        this.onDragFreeOn = f;
    }

    public enact(directives: Grammar.Animation, setStatus: setState | undefined, startAtFrame: number = 0, doPlay: boolean = false, setPreview?: setState<string | null>  | null | undefined) {
        this.setStatus = setStatus;

        this.player.setFrames({
            numberOfFrames: directives.length,
            playNextFunction: (nextIndex) => {
                // this.cy?.startBatch();

                // If starting at 0, reset graph
                if (nextIndex === 0) {
                    this.reset();
                }

                // Run next frame
                this.run_keyframe(directives[nextIndex].data, true);

                // this.cy?.endBatch(); 
                setPreview && this.cy && setPreview(this.cy.png({scale: 4, full: true}));
            },
            skipToFunction: (nextIndex) => {
                // Reset
                this.cy?.startBatch();
                this.reset();
                this.cy?.endBatch();
                // Perform upto nextIndex steps
                // TODO: consider adding 1 to nextIndex
                this.cy?.startBatch();
                const frames = directives.slice(0, nextIndex + 1).map(keyframe => {
                    return this.run_keyframe(keyframe.data, false)
                });
                this.cy?.endBatch();
                setPreview && this.cy && setPreview(this.cy.png({scale: 4, full: true}));
                return frames;
            }
        });

        this.player.skipTo(startAtFrame); //Change this to current line
        if (doPlay) this.player.play();
    }
}
