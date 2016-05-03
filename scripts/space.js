/* 
 * Spaces exist between squares. This is true without there being an object to represent
 * them but is also true for this object. Spaces are used as a selection point for performing
 * actions on multiple squares. You click on the Space in the middle of 4 squares in order to
 * perform an action on all 4 squares. 

 * Since actions on spaces don't have an explicit target they can be performed recursively.
 * I think this will make them interesting to use and a very effective tool for fast 
 * manipulation of gamesquares.
 */

var Config = require("./config.js");
var THREE = require("./lib/three.min.js");
var Materials = require("./materials.js");
var GameState = require("./gamestate.js");
var Types = require("./types.js");

function Space(config_details) {    
    if (config_details.node === undefined)
        throw "Spaces must have associated nodes";

    this.node = config_details.node;
    //default constructor creates a space the goes in the gap between 4 squares
    var h = config_details.height === undefined? Config.gap : config_details.height;
    var w = config_details.width === undefined? Config.gap : config_details.width;
    
    var geom = new THREE.BoxGeometry(h, w, Config.depth);
    this.mesh = new THREE.Mesh(geom, Materials.simple_material2.clone());
    this.mesh.position.x = config_details.x === undefined ? 0 : config_details.x;
    this.mesh.position.y = config_details.y === undefined ? 0 : config_details.y;
    this.mesh.position.z = config_details.y === undefined ? 0 : config_details.z;
    this.mesh.shape = this;

    //hide the mesh by default
    this.mesh.material.visible = config_details.visible === undefined ? false : config_details.visible;
    

    this.addToScene();
    //console.log("space created!");

    //how does the space know which children squares it is associated with?
    //it takes a child predicate function that acts on the index of the child examined
    this.childp = config_details.childp === undefined ?
        function(index){return true;} : config_details.childp;

    //we need to be able to identify squares and spaces as different...
    //though with duck-typing we can get pretty far...
}

Space.prototype.requestSplit = function() {
    this.node.forEachChild(function(child_val){ child_val.requestSplit(); });
};

Space.prototype.flip = function() {
    this.node.forEachChild(function(child_val){ child_val.flip(); });
};

Space.prototype.requestMerge = function() {
    // merge to the level of depth of this space
    // choose the colour based on appearance -> traverse and add up.
    // divide by 4 for each level of depth
    //

    //OR always unflipped? like a big reset button
    var gs = this.node.getGameSquare();
    gs.addPositionedSquareAtNode(this.node, false);
    gs.updateSquareString();    
};

// TODO: reorganise this
Space.prototype.animateMoveTo = function() {
    this.kill();    
};
Space.prototype.animateFade = function() {};

Space.prototype.kill = function() {
    //console.log("space deleted!");
    GameState.scene.remove(this.mesh);
};

Space.prototype.addToScene = function() {
    GameState.scene.add(this.mesh);
};

Space.prototype.getType = function() {
    return Types.Space;
};

module.exports = Space;
