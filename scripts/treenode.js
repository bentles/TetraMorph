/*
 * Gamesquares are quaternary trees. The basic building blocks of these trees are treenodes.
 * Treenodes will always have a value which is either a square or a space. If the value is
 * a space then the node will have 4 child nodes associated with it. Otherwise it will not.
 *
 * Spaces and Squares are given references back to their node. This is so an operation like
 * merging Squares together can take place, as it requires knowledge of the rest of the tree
 * structure. 
 *
 * Child nodes are also given references to their parents. This is allows for traversals up 
 * the tree structure. This is another requirement for merging squares together.
 */

var GameSquare = require("./gamesquare.js");
var GameState = require("./gamestate.js");
var Space = require("./space.js");
var THREE = require("./lib/three.min.js");

function Node(value, parent, children) {
    this.value = (value === undefined) ? null : value;
    this.parent = (parent === undefined) ? null : parent;
    this.children = (children === undefined) ? [] : children;

    //Only leaf nodes may have a value
    if (this.children.length !== 0)
        this.value = new Space(this);

    if (this.value !== null) // TODO: meh me not like this
        this.value.addToScene();
}

Node.prototype.initChildren = function() {
    var pos = new THREE.Vector3(0,0,0);

    if (this.value) {
        pos = this.value.mesh.position;
        this.value.kill();
    }
        
    this.value = new Space({ node:this, x: pos.x, y: pos.y, z:pos.z });
    this.children = [];
    for (var i = 0; i < 4; i++) {
        var a = new Node(null, this);
        this.children.push(a);
    }
};

Node.prototype.hasChildren = function() {
    return this.children.length > 0;
};

Node.prototype.forEach = function(fn, thisArg) {
    //apply the function to the value
    fn(this.value);

    //apply the function to the children if it has any
    if(this.hasChildren())
        this.children.forEach(function(child) {
            child.forEach(fn);
        });
};

Node.prototype.forEachChild = function(fn) {
    if(this.hasChildren())
        this.children.forEach(function(child) {
            fn(child.value);
        });
};

Node.prototype.getGameSquare = function() {
    return (this.parent instanceof Node) ?  this.parent.getGameSquare() : this.parent ;
};

Node.prototype.setValue = function(square) {
    if (this.value && this.value.kill)
        this.value.kill();
    
    this.value = square;
    square.node = this;
    square.addToScene();

    //remove children - useful for merging I guess
    this.children.forEach( //array forEach
        function(child) {
            child.forEach( //node forEach
                function(square) {
                    square.kill();
                });
        });

    this.children = [];
};

module.exports = Node;
