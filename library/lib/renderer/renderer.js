var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
import cytoscape from 'cytoscape';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import { debounce } from '../core/helpers';
import { Core, OrderedComplete } from '../core/Core';
var popper = require('cytoscape-popper');
cytoscape.use(popper);
var GraphManager = (function () {
    function GraphManager() {
        this.cy = undefined;
        this.core = undefined;
    }
    GraphManager.prototype.run_keyframe = function (keyframe, animate) {
        var _this = this;
        var _a;
        if (animate === void 0) { animate = true; }
        if (!keyframe)
            return null;
        var orderedComplete = new OrderedComplete(keyframe.length);
        var res = keyframe.map(function (command, i) { return _this.run_command(command, animate, orderedComplete); });
        try {
            (_a = this.core) === null || _a === void 0 ? void 0 : _a.update();
            return res;
        }
        catch (error) {
            console.log("Error Evaluating Code Update", error);
            this.setStatus && this.setStatus({ status: "error", message: "Unsupported Line" });
        }
        return res;
    };
    GraphManager.prototype.run_command = function (command, animate, orderedComplete) {
        var _a;
        if (animate === void 0) { animate = true; }
        try {
            var res = (_a = this.core) === null || _a === void 0 ? void 0 : _a.evaluate(command, undefined, true, animate, orderedComplete);
            return res;
        }
        catch (error) {
            console.log("Error Evaluating Code", error);
            this.setStatus && this.setStatus({ status: "error", message: "Unsupported Line" });
        }
        return null;
    };
    GraphManager.prototype.reset = function () {
        var _a, _b, _c;
        (_b = (_a = this.core) === null || _a === void 0 ? void 0 : _a.cy) === null || _b === void 0 ? void 0 : _b.elements().remove();
        (_c = this.core) === null || _c === void 0 ? void 0 : _c.reset();
    };
    return GraphManager;
}());
export { GraphManager };
var GraphManagerHeadless = (function (_super) {
    __extends(GraphManagerHeadless, _super);
    function GraphManagerHeadless() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    GraphManagerHeadless.prototype.init = function (cy, parser) {
        this.cy = cytoscape({
            container: document.getElementById("hidden-headless-graph")
        });
        ;
        this.core = new Core(this.cy, parser, { animate_duration: 0 });
    };
    GraphManagerHeadless.prototype.enact = function (directives, setStatus, setFrames) {
        this.setStatus = setStatus;
        var frames = this.run_animation_for_frames(directives);
        setFrames && setFrames(__spreadArray([], frames) || []);
    };
    GraphManagerHeadless.prototype.run_animation_for_frames = function (directives) {
        var _this = this;
        var _a, _b;
        (_a = this.cy) === null || _a === void 0 ? void 0 : _a.startBatch();
        this.reset();
        (_b = this.cy) === null || _b === void 0 ? void 0 : _b.endBatch();
        var frames = directives.map(function (_a) {
            var _b, _c, _d, _e;
            var keyframe = _a.data;
            (_b = _this.cy) === null || _b === void 0 ? void 0 : _b.startBatch();
            _this.run_keyframe(keyframe, false);
            (_c = _this.cy) === null || _c === void 0 ? void 0 : _c.$("[label]").style({ label: null });
            (_d = _this.cy) === null || _d === void 0 ? void 0 : _d.endBatch();
            var res = (_e = _this.cy) === null || _e === void 0 ? void 0 : _e.png({
                scale: 4,
            });
            return res;
        });
        return frames;
    };
    return GraphManagerHeadless;
}(GraphManager));
export { GraphManagerHeadless };
var debouncedDragFree = debounce(function (event, onDragFreeOn) {
    var node = event.target;
    !!onDragFreeOn && onDragFreeOn(node, event.target._private.position);
}, 100);
var GraphManagerPlayer = (function (_super) {
    __extends(GraphManagerPlayer, _super);
    function GraphManagerPlayer(player, coreConfig) {
        if (coreConfig === void 0) { coreConfig = {}; }
        var _this = _super.call(this) || this;
        _this.player = player;
        _this.coreConfig = {};
        _this.onDragFreeOn = undefined;
        _this.coreConfig = coreConfig;
        return _this;
    }
    GraphManagerPlayer.prototype.init = function (cy, parser, main) {
        var _this = this;
        if (main === void 0) { main = false; }
        this.cy = cy;
        this.core = new Core(cy, parser, this.coreConfig);
        if (main)
            cy.on('mouseover', function (event) {
                var _a, _b;
                if (event.target.scratch("tip") !== undefined)
                    return;
                var ele = event.target;
                var id = (_b = (_a = ele === null || ele === void 0 ? void 0 : ele._private) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.id;
                if (id === undefined)
                    return;
                var ref = ele.popperRef();
                var dummyDomEle = document.createElement('div');
                dummyDomEle.style.display = "none";
                dummyDomEle.style.opacity = "0";
                dummyDomEle.style.position = "relative";
                dummyDomEle.style.zIndex = "-1";
                var tip = new tippy(dummyDomEle, {
                    getReferenceClientRect: ref.getBoundingClientRect,
                    trigger: 'manual',
                    content: function () {
                        var content = document.createElement('div');
                        content.innerHTML = "(" + ele._private.group + ") id: " + ele._private.data.id;
                        return content;
                    }
                });
                tip.show();
                event.target.scratch("tip", tip);
            });
        if (main)
            cy.on('dragfreeon', "node", function (ev) {
                debouncedDragFree(ev, _this.onDragFreeOn);
            });
        if (main)
            cy.on('mouseout', function (event) {
                var tip = event.target.scratch("tip");
                event.target.removeScratch("tip");
                if (tip) {
                    tip.destroy();
                }
            });
    };
    GraphManagerPlayer.prototype.setOnDragFreeOn = function (f) {
        this.onDragFreeOn = f;
    };
    GraphManagerPlayer.prototype.enact = function (directives, setStatus, startAtFrame, doPlay, setPreview) {
        var _this = this;
        if (startAtFrame === void 0) { startAtFrame = 0; }
        if (doPlay === void 0) { doPlay = false; }
        this.setStatus = setStatus;
        this.player.setFrames({
            numberOfFrames: directives.length,
            playNextFunction: function (nextIndex) {
                if (nextIndex === 0) {
                    _this.reset();
                }
                _this.run_keyframe(directives[nextIndex].data, true);
                setPreview && _this.cy && setPreview(_this.cy.png({ scale: 4, full: true }));
            },
            skipToFunction: function (nextIndex) {
                var _a, _b, _c, _d;
                (_a = _this.cy) === null || _a === void 0 ? void 0 : _a.startBatch();
                _this.reset();
                (_b = _this.cy) === null || _b === void 0 ? void 0 : _b.endBatch();
                (_c = _this.cy) === null || _c === void 0 ? void 0 : _c.startBatch();
                var frames = directives.slice(0, nextIndex + 1).map(function (keyframe) {
                    return _this.run_keyframe(keyframe.data, false);
                });
                (_d = _this.cy) === null || _d === void 0 ? void 0 : _d.endBatch();
                setPreview && _this.cy && setPreview(_this.cy.png({ scale: 4, full: true }));
                return frames;
            }
        });
        this.player.skipTo(startAtFrame);
        if (doPlay)
            this.player.play();
    };
    return GraphManagerPlayer;
}(GraphManager));
export { GraphManagerPlayer };
