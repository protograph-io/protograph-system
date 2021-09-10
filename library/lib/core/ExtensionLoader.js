import { ProtoGraphLoaderNamespace } from "../config";
var ExtensionLoader = (function () {
    function ExtensionLoader() {
        this.extensions = new Map();
    }
    ExtensionLoader.prototype._register = function (extension) {
        this.extensions.set(extension.name, extension);
        extension.init && extension.init();
    };
    ExtensionLoader.prototype.register = function (extension) {
        if (this.extensions.has(extension.name))
            return;
        this._register(extension);
    };
    ExtensionLoader.prototype.entries = function () {
        return this.extensions.entries();
    };
    return ExtensionLoader;
}());
var loader = (function declareGlobally() {
    return new ExtensionLoader();
})();
if (!window[ProtoGraphLoaderNamespace]) {
    window[ProtoGraphLoaderNamespace] = loader;
}
export default loader;
