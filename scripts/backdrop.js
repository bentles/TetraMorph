var Animation = require("./animation.js");
var THREE = require("./three.min.js");
var Config = require("./config.js");

//need a cleaner way to do this stuff

function Backdrop(dimension, repeats, startcolour, scene, animationlist) {
    var that = this;
    this.breathespeed = Config.breathespeed;
    this.animationlist = animationlist;
    this.repeats = repeats;
    this.width = dimension;
    this.height = dimension;

    //create textures
    this.texture1 = this.generateTexture(0x444444, 0, 0x999999, 0, this.width, this.height,
        function(i) {
            return (i % (that.width + 1));
        });

    this.texture2 = this.generateTexture(0x444444, 0, 0x999999, 0, this.width, this.height,
        function(i) {
            return !(that.width * that.height - 1 - i) || !i || i % (that.width - 1);
        });

    //first texture setup
    this.text1 = new THREE.DataTexture(this.texture1, this.width, this.height, THREE.RGBAFormat);
    this.text1.wrapS = this.text1.wrapT = THREE.RepeatWrapping;
    this.text1.repeat.set(this.repeats, 1);

    //second texture setup
    this.text2 = new THREE.DataTexture(this.texture2, this.width, this.height, THREE.RGBAFormat);
    this.text2.wrapS = this.text2.wrapT = THREE.RepeatWrapping;
    this.text2.repeat.set(1, this.repeats);

    //do the necessary (remove antialiasing and make textures live)
    this.textureNec(this.text1);
    this.textureNec(this.text2);

    //create materials
    this.mat1 = new THREE.MeshPhongMaterial({
        map: this.text1,
        vertexColors: THREE.FaceColors,
        side: THREE.BackSide
    });
    this.mat2 = new THREE.MeshPhongMaterial({
        map: this.text2,
        vertexColors: THREE.FaceColors,
        side: THREE.BackSide
    });
    this.mats = [this.mat1, this.mat2];
    this.matmap = [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0];

    this.backdrop = new THREE.MeshFaceMaterial(this.mats);
    this.mat2.color.setHex(startcolour);
    this.mat1.color.setHex(0x0000CC);

    this.geom = new THREE.BoxGeometry(2100, 1000, 60000);
    for (var i = 0; i < this.matmap.length; i++) {
        this.geom.faces[i].materialIndex = this.matmap[i];
    }

    this.mesh = new THREE.Mesh(this.geom, this.backdrop);

    scene.add(this.mesh);
}

Backdrop.prototype.animateBreathe = function() {
    var step = 0;
    var mesh = this.mesh;
    this.animationlist.push(new Animation(function() {
        step += Math.PI * this.breathespeed;
        step = (step >= 2 * Math.PI) ? step - 2 * Math.PI : step;
        mesh.scale.set((Math.cos(step) + 2), (Math.cos(step) + 2), 1);
        return false;
    }));
};

Backdrop.prototype.setColor = function(hex) {
    this.mat2.color.setHex(hex);
};

Backdrop.prototype.setRepeats = function(i) {
    this.repeats = i;
    this.text1.repeat.set(this.repeats, 1);
    this.text2.repeat.set(1, this.repeats);
};

//necessary texture initiation that should be out of the way
Backdrop.prototype.textureNec = function(texture) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.LinearMipMapLinearFilter;
    texture.needsUpdate = true;
};

Backdrop.prototype.getRGB = function(colorHex) {
    var r = colorHex / 0x10000 | 0;
    var g = (colorHex % 0x10000) / 0x100 | 0;
    var b = colorHex % 0x100;

    return {
        "r": r,
        "g": g,
        "b": b
    };
};

/*
 *programatically create a pixelated striped texture
 *because downloading stuff is slow
 *func takes a single argument, i, that is the position of the pixel
 *in the image and returns true or false
 */
Backdrop.prototype.generateTexture = function(color1, alpha1, color2, alpha2, width, height, func) {
    var col1 = this.getRGB(color1);
    var col2 = this.getRGB(color2);
    var numpixels = width * height;
    var texture = new Uint8Array(numpixels * 4);

    for (var i = 0; i < numpixels; i++) {
        if (func(i))
            this.addColorUints(col1, alpha1, texture, i * 4);
        else
            this.addColorUints(col2, alpha2, texture, i * 4);
    }
    return texture;
};
Backdrop.prototype.addColorUints = function(color, alpha, array, i) {
    array[i] = color.r;
    array[i + 1] = color.g;
    array[i + 2] = color.b;
    array[i + 3] = alpha;
};

module.exports = Backdrop;
