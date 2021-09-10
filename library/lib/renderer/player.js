var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var Player = (function () {
    function Player(config) {
        if (config === void 0) { config = {}; }
        this.publishStateHandler = undefined;
        this.state = {
            nextFrame: 0,
            isPlaying: false,
            numberOfFrames: 0,
        };
        this.config = {
            loop: false,
            frameDuration: 1500,
        };
        this.handlers = {
            skipToFunction: function (_) { },
            playNextFunction: function (_) { }
        };
        this.currentSetTimeout = null;
        this.config = __assign(__assign({}, this.config), config);
    }
    Player.prototype.setStateHandler = function (handler) {
        this.publishStateHandler = handler;
    };
    Player.prototype.publishState = function () {
        this.publishStateHandler && this.publishStateHandler(__assign({}, this.state));
    };
    Player.prototype.getState = function () {
        return __assign({}, this.state);
    };
    Player.prototype.setFrames = function (state) {
        (this.currentSetTimeout !== null) && this.onEnd(this.state.nextFrame);
        this.state.nextFrame = 0;
        this.state.numberOfFrames = state.numberOfFrames;
        this.handlers.playNextFunction = state.playNextFunction;
        this.handlers.skipToFunction = state.skipToFunction;
        this.handlers.onStartFunction = state.onStartFunction;
        this.handlers.onEndFunction = state.onEndFunction;
        this.publishState();
    };
    Player.prototype.getFrame = function () {
        return this.state.nextFrame;
    };
    Player.prototype.play = function (until, callBack) {
        if (until === void 0) { until = undefined; }
        (this.currentSetTimeout !== null) && this.onEnd(this.state.nextFrame);
        if (this.state.isPlaying)
            return;
        this.state.isPlaying = true;
        if (this.state.nextFrame === this.state.numberOfFrames)
            this.state.nextFrame = 0;
        this.onStart(this.state.nextFrame);
        this.playInternal(until, callBack);
        this.publishState();
    };
    Player.prototype.onStart = function (startIndex) {
        var _a, _b;
        return ((_a = this.handlers) === null || _a === void 0 ? void 0 : _a.onStartFunction) && ((_b = this.handlers) === null || _b === void 0 ? void 0 : _b.onStartFunction(startIndex));
    };
    Player.prototype.onEnd = function (endFrame) {
        var _a, _b;
        this.state.isPlaying = false;
        (this.currentSetTimeout !== null) && window.clearTimeout(this.currentSetTimeout);
        return ((_a = this.handlers) === null || _a === void 0 ? void 0 : _a.onEndFunction) && ((_b = this.handlers) === null || _b === void 0 ? void 0 : _b.onEndFunction(endFrame));
    };
    Player.prototype.playInternal = function (until, callBack) {
        var _this = this;
        if (until === void 0) { until = undefined; }
        if (!this.state.isPlaying)
            return;
        this.handlers.playNextFunction(this.state.nextFrame);
        this.state.nextFrame++;
        this.publishState();
        if (until && this.state.nextFrame >= until) {
            this.onEnd(this.state.nextFrame - 1);
            callBack && callBack();
            return;
        }
        if (this.state.nextFrame === this.state.numberOfFrames && !this.config.loop) {
            this.onEnd(this.state.nextFrame - 1);
            callBack && callBack();
            return;
        }
        else if (this.state.nextFrame === this.state.numberOfFrames && this.config.loop) {
            this.state.nextFrame = 0;
        }
        this.currentSetTimeout = window.setTimeout(function () {
            _this.playInternal(until, callBack);
        }, this.config.frameDuration);
        return;
    };
    Player.prototype.pause = function () {
        this.state.isPlaying = false;
        (this.currentSetTimeout !== null) && this.onEnd(this.state.nextFrame);
        this.publishState();
    };
    Player.prototype.skipToIfNotThere = function (frameIndex) {
        if (frameIndex === this.state.nextFrame - 1)
            return;
        this.skipTo(frameIndex);
    };
    Player.prototype.skipTo = function (frameIndex) {
        this.state.nextFrame = frameIndex;
        this.handlers.skipToFunction(frameIndex);
        this.state.nextFrame++;
        this.publishState();
    };
    return Player;
}());
export { Player };
