import { ProtoGraphLoaderNamespace } from "../config";
var IdGenerator = (function () {
    function IdGenerator() {
        this.incrementer = 1;
    }
    IdGenerator.prototype.createId = function (prefix) {
        if (prefix === void 0) { prefix = "n"; }
        var id = prefix + this.incrementer;
        this.incrementer++;
        return id;
    };
    IdGenerator.prototype.reset = function () {
        this.incrementer = 1;
    };
    return IdGenerator;
}());
export { IdGenerator };
function init(core) {
    core.defineUtility("IdGenerator", new IdGenerator());
}
var loader = window[ProtoGraphLoaderNamespace];
var declaration = { name: "utility_id_generator", exec: init };
loader.register(declaration);
export default declaration;
