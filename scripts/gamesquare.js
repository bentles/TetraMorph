var THREE = require("./lib/three.min.js");

var Square = require("./square.js");
var util = require("./utilities.js");
var Node = require("./treenode.js");
var Config = require("./config.js");
var GameState = require("./gamestate.js");

function GameSquare(material, materialmap, difficulty, editable) { //0 difficulty is just a single square
    this.material = material.clone();
    this.materialmap = materialmap;
    this.difficulty = difficulty;
    this.editable = (editable === undefined) ? true : editable;

    this.gap = Config.gap;
    this.depth = Config.depth;

    this.squareString = "";
    this.z = 0;
    this.x = 0;
    //make the parent of the top node the gamesquare
    this.squares = new Node(null, this);
}

GameSquare.prototype.generateSquareString = function() {
    //generates strings of the form "t" or "(tttt)" or
    //"(tf(ttf(tfff))f)" which represent a gamesquare's squares
    //equality of two gamesquares is simply equality of their
    //squareString the squarestring is maintained by the gamesquare
    //through all operations

    if (this.difficulty === 0) {
        this.squareString = "f";
    }
    else {
        this.squareString = GameState.rng() >= 0.5 ? "f" : "t";

        for (var i = 0; i < (this.difficulty / 10); i++) {
            var operation = GameState.rng() >= 0.5;

            var details = this.getSkewedRandomLetterDetails();

            if (operation && details.depth < 3) //splitting a square
                this.splitAtNthLetter(details.pos);
            else if (!operation)
                this.flipAtNthLetter(details.pos);
        }

        if (this.squareString === "f")
            this.generateSquareString();
    }
};

GameSquare.prototype.getSkewedRandomLetterDetails = function() {
    var rand = GameState.rng(); //[0, 1)
    var depth = 0;
    var length = this.squareString.length;

    while (rand >= 0 && length--) {
        if (this.squareString[length] === ")")
            depth++;
        else if (this.squareString[length] === "(")
            depth--;
        else
            rand -= 1 / Math.pow(4, depth);
    }

    return {
        "pos" : length,
        "depth" : depth
    };
};

GameSquare.prototype.generateSquares = function() {
    //takes the squareString and creates the actual meshes that represent the gamesquare
    //these are packaged into Square objects for easy manipulation
    //these in turn are placed in a quaternary-tree

    if (this.squareString === "")
        this.generateSquareString();
    //0 top left
    //1 top right
    //2 bot left
    //3 bot right

    var cornerlist = [0];

    //this is how deep we are in the tree
    var level = 0;

    //visits nodes and builds the squares tree (hopefully)
    var visitor = this.squares;

    //parse the string and create appropriately sized and spaced meshes
    for (var i = 0; i < this.squareString.length; i++) {
        switch (this.squareString[i]) {
            case "(":
                {
                    visitor.initChildren();
                    visitor = visitor.children[0];
                    level++;
                    cornerlist[level] = 0;
                }
                break;
            case ")":
                {
                    level--;
                    cornerlist[level]++;
                    cornerlist.pop();

                    visitor = visitor.parent;

                    if (visitor.parent.children)
                        if (visitor.parent.children[cornerlist[level]])
                            visitor = visitor.parent.children[cornerlist[level]];
                }
                break;
            default:
                {
                    var newSquare = this.generatePositionedSquare(cornerlist, this.squareString[i] === "t");
                    visitor.setValue(newSquare);
                    newSquare.node = visitor;
                    cornerlist[level]++;

                    if (visitor.parent.children)
                        if (visitor.parent.children[cornerlist[level]])
                            visitor = visitor.parent.children[cornerlist[level]];
                }
                break;
        }
    }
};

GameSquare.prototype.addPositionedSquareAtNode = function(node, flipped) {
    var orignode = node;
    var cornerlist = [];
    while (node.parent instanceof Node) {
        cornerlist.unshift(node.parent.children.indexOf(node)); //<-- urgh but whatevs
        node = node.parent;
    }
    cornerlist.unshift(0);

    var newSquare = this.generatePositionedSquare(cornerlist, flipped);
    newSquare.mesh.position.x += this.x;
    orignode.setValue(newSquare);
};

GameSquare.prototype.generatePositionedSquare = function(cornerlist, flipped) {
    var totalx = 0;
    var totaly = 0;

    //helper variable for calculating position
    var height = Config.game_square_size;

    for (var i = 1; i < cornerlist.length; i++) {
        var x = (cornerlist[i] % 2);
        x = x === 0 ? -1 : x;
        var y = cornerlist[i] < 2 ? 1 : -1;

        var change = height / 4 + this.gap / 4;
        height = (height - this.gap) / 2;

        totalx += x * change;
        totaly += y * change;
    }

    i--; //i must be one too large for the loop to end

    var geom = new THREE.BoxGeometry(height, height, this.depth);

    for (var j = 0; j < 12; j++) {
        geom.faces[j].materialIndex = this.materialmap[j];
    }

    var mesh = new THREE.Mesh(geom, this.material);

    mesh.position.x = totalx;
    mesh.position.y = totaly;

    if (flipped)
        mesh.rotation.x = Math.PI;

    return new Square(mesh, flipped, this.editable);
};

GameSquare.prototype.clearSquares = function() {
    var that = this;
    this.squares.forEach(function(square) {
        GameState.scene.remove(square.mesh);
    });
    this.squares = new Node(null, this);
    this.squareString = "";
};

GameSquare.prototype.playerReset = function() {
    this.clearSquares();
    this.squareString = "f";
    this.generateSquares();
    this.squares.value.mesh.position.x += -550;
};

GameSquare.prototype.getSquareStringDetails = function() {
    var t = 0;
    var f = 0;

    var len = this.squareString.length;
    while (len--) {
        var chr = this.squareString[len];
        if (chr === "f")
            f++;
        else if (chr === "t")
            t++;
    }

    return {
        "t": t,
        "f": f
    };
};

GameSquare.prototype.splitAtNthLetter = function(n) {
    this.squareString = this.squareString.substring(0, n) + "(" +
        this.squareString[n] + this.squareString[n] + this.squareString[n] + this.squareString[n] + //split
        ")" + this.squareString.substring(n + 1, this.squareString.length);
};

GameSquare.prototype.flipAtNthLetter = function(n) {
    this.squareString = this.squareString.substring(0, n) +
        (this.squareString[n] === "f" ? "t" : "f") + //flip
        this.squareString.substring(n + 1, this.squareString.length);
};

GameSquare.prototype.updateSquareString = function() {
    this.squareString = getSquareString(this.squares);
};

//recursion is fun :D
function getSquareString(node) {
    if (node.hasValue())
        return node.value.flipped ? "t" : "f";
    else {
        var cn = node.children;
        return "(" + getSquareString(cn[0]) + getSquareString(cn[1]) +
            getSquareString(cn[2]) + getSquareString(cn[3]) + ")";
    }
}

GameSquare.prototype.forEachSquareMesh = function(func) {
    this.squares.forEach(function(x) {
        func(x.mesh);
    });
};

GameSquare.prototype.getZ = function() {
    return this.z;
};

GameSquare.prototype.setZ = function(num) {
    this.z = num;
    this.forEachSquareMesh(function(mesh) {
        mesh.position.z = num;
    });
};

GameSquare.prototype.addZ = function(num) {
    this.z += num;
    this.forEachSquareMesh(function(mesh) {
        mesh.position.z += num;
    });
};

GameSquare.prototype.getX = function() {
    return this.x;
};

GameSquare.prototype.addX = function(num) {
    this.x += num;
    this.forEachSquareMesh(function(mesh) {
        mesh.position.x += num;
    });
};

module.exports = GameSquare;
