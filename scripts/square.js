var THREE = require("./three.min.js");
var Animation = require("./animation.js");
var Config = require("./config.js");
var GameState = require("./gamestate.js");

function Shape(mesh) {
    this.mesh = mesh;
    mesh.shape = this;
}

function Square(mesh, flipped, editable) {
    Shape.call(this, mesh);
    this.flipped = (flipped === undefined) ? false : flipped;
    this.editable = (editable === undefined) ? true : editable;
    this.node = null;
}

Square.prototype = Object.create(Shape.prototype);
Square.prototype.requestSplit = function() {
    if (this.editable) {
        var gs = this.node.getGameSquare();
        this.node.initChildren();
        for (var i = 0; i < 4; i++)
            gs.addPositionedSquareAtNode(this.node.children[i], this.flipped);
        gs.updateSquareString();
    }
};
Square.prototype.flip = function() {
    if (this.editable) {
        this.flipped = !this.flipped;
        this.animateFlip(15);
        var gs = this.node.getGameSquare();
        gs.updateSquareString();
    }
};
Square.prototype.requestMerge = function() {
    if (this.editable) {
        var gs = this.node.getGameSquare();
        gs.addPositionedSquareAtNode(this.node.parent, this.flipped);
        gs.updateSquareString();
    }
};
Square.prototype.animateFlip = function(pifractions) {
    var mesh = this.mesh;
    var step = (1 / pifractions) * Math.PI;
    var count = 0;

    //LEXICAL CLOSURES HAAA!!!! (Imagine DBZ voice acting)
    GameState.animationlist.push(new Animation(
        function() {
            if (count < pifractions) {
                mesh.rotation.x += step;
                count++;

                if (mesh.rotation.x >= Math.PI * 2)
                    mesh.rotation.x = mesh.rotation.x - Math.PI * 2;
                return false;
            } else {
                if (this.node != null) {
                    this.node.getGameSquare().updateSquareString();
                    console.log(this.node.getGameSquare().squareString);
                }

                return true;
            }
        }));
};

/*
 *Takes a function that generates an animation, this function takes 3 paramaters
 *the first is the square we manipulate, the last two are an optional flag and a callback
 */
Square.prototype.animate = function(funcgen, destroy, callback) {
    GameState.animationlist.push(new Animation(funcgen(this, destroy, callback)));
};
Square.prototype.animateFade = function(steps, kill, callback) {
    this.animate(
        function(square, destroy, callback) {
            var totalsteps = steps * Config.tps;
            var decrease = 1 / totalsteps;
            return function() {
                square.mesh.material.materials.forEach(function(x) {
                    x.opacity -= decrease;
                });
                totalsteps--;

                if (!totalsteps) {
                    square.killOrCallback(destroy, callback);
                    return true;
                }
                return false;
            };
        }, kill, callback);
};

Square.prototype.animateMoveTo = function(posVect3, dimensionsVect2, rotationEuler, steps, kill, callback) {
    this.animate(
        function(square, destroy, callback) {
            var totalsteps = steps * Config.tps;
            var mesh = square.mesh;
            var posdiff = new THREE.Vector3();
            posdiff.subVectors(posVect3, mesh.position);
            posdiff.divideScalar(totalsteps);

            var thisdimens = new THREE.Vector2(mesh.geometry.parameters.width, mesh.geometry.parameters.height);
            var thatdimens = thisdimens.clone();
            var dimensiondiff = new THREE.Vector2();
            dimensiondiff.subVectors(thisdimens, dimensionsVect2);
            dimensiondiff.divideScalar(totalsteps);

            var rotxdiff = rotationEuler.x - mesh.rotation.x;
            rotxdiff /= totalsteps;
            var rotydiff = rotationEuler.y - mesh.rotation.y;
            rotydiff /= totalsteps;
            var rotzdiff = rotationEuler.z - mesh.rotation.z;
            rotzdiff /= totalsteps;

            return function() {

                mesh.position.add(posdiff);
                thatdimens.sub(dimensiondiff);
                mesh.scale.x = thatdimens.x / thisdimens.x;
                mesh.scale.y = thatdimens.y / thisdimens.y;
                mesh.rotation.x += rotxdiff;
                mesh.rotation.y += rotydiff;
                mesh.rotation.z += rotzdiff;

                totalsteps--;
                if (!totalsteps) {
                    square.killOrCallback(destroy, callback);
                    return true;
                }
                return false;
            };
        }, true, callback);
};

Square.prototype.killOrCallback = function(destroy, callback) {
    if (destroy)
        GameState.scene.remove(this.mesh);
    if (callback)
        callback();
};


module.exports = Square ;
