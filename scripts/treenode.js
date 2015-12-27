var GameSquare = require("./gamesquare.js");
var GameState = require("./gamestate.js");

function Node(value, parent, children) {
    this.value = (value === undefined) ? null : value;
    this.parent = (parent === undefined) ? null : parent;
    this.children = (children === undefined) ? [] : children;

    //Only leaf nodes may have a value
    if (this.children.length !== 0)
        this.value = null;
}
Node.prototype.initChildren = function() {
    if (this.value)
        GameState.scene.remove(this.value.mesh);

    this.value = null;
    this.children = [];
    for (var i = 0; i < 4; i++) {
        var a = new Node(null, this);
        this.children.push(a);
    }
};

Node.prototype.hasValue = function() {
    return this.value !== null;
};

Node.prototype.forEach = function(fn, thisArg) {
    if (this.hasValue())
        fn(this.value);
    else
        this.children.forEach(function(child) {
            child.forEach(fn);
        });
};

Node.prototype.getGameSquare = function() {
    return (this.parent instanceof Node) ?  this.parent.getGameSquare() : this.parent ;
};

Node.prototype.setValue = function(square) {
    this.value = square;
    square.node = this;
    var scene = GameState.scene;
    scene.add(square.mesh);

    if (!this.children.forEach)
        var a = 12;

    this.children.forEach(
        function(child) {
            child.forEach(
                function(square) {
                    scene.remove(square.mesh);
                });
        });

    this.children = [];
};


module.exports = Node;
