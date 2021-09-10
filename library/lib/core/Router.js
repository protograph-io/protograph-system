var Router = (function () {
    function Router() {
        this.map = new Map();
    }
    Router.prototype.load = function (keyword, handler) {
        this.map.set(keyword.toLowerCase(), handler);
    };
    Router.prototype.loadAssertUnique = function (keyword, handler) {
        if (this.map.has(keyword.toLowerCase()))
            throw Error("Grammar keyword already in use");
        this.load(keyword, handler);
    };
    Router.prototype.get = function (keyword) {
        return this.map.get(keyword.toLowerCase());
    };
    Router.prototype.has = function (keyword) {
        return this.map.has(keyword.toLowerCase());
    };
    Router.prototype.forEach = function (f) {
        return this.map.forEach(f);
    };
    Router.prototype.entries = function () {
        return this.map.entries();
    };
    return Router;
}());
export { Router };
