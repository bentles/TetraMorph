/* 
 * Spaces exist between squares. This is true without there being a object to represent
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

function Space(node, childp, height, width) {
	if (node === undefined)
		throw "Spaces must have associated nodes";

	this.node = node;
	
	//default constructor creates a space the goes in the gap between 4 squares
	var h = height === undefined? Config.gap : height;
	var w = width === undefined? Config.gap : width;
	
	var geom = new THREE.BoxGeometry(h, w, Config.depth);
	this.mesh = new THREE.Mesh(geom, Materials.simple_material.clone());
/*	this.mesh.position.x = 0,
	this.mesh.position.y = -2,
	this.mesh.position.z = 0,*/

	this.addToScene();
	console.log("space created!");

	//how does the space know which children squares it is associated with?
	//it takes a child predicate function that acts on the index of the child examined
	this.childp = childp === undefined ? function(index){return true;} : childp;

	//we need to be able to identify squares and spaces as different...
	//though with duck-typing we can get pretty far...
}

// TODO: reorganise this
Space.prototype.animateMoveTo = function() {};
Space.prototype.animateFade = function() {};

Space.prototype.kill = function() {
	GameState.scene.remove(this.mesh);
};

Space.prototype.addToScene = function() {
	GameState.scene.add(this.mesh);
};

module.exports = Space;
