var THREE = require("./lib/three.min.js");
var Config = require("./config.js");

//work out shapes and materials
var frontmaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    color: Config.light_colour,
    shininess: 50,
    vertexColors: THREE.FaceColors
});
var sidematerial = new THREE.MeshBasicMaterial({
    transparent: true,
    color: 0x123123,
    shininess: 50,
    vertexColors: THREE.FaceColors
});
var backmaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    color: Config.dark_colour,
    shininess: 50,
    vertexColors: THREE.FaceColors
});
var materials = [frontmaterial, sidematerial, backmaterial];

var materialmap = [1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 2, 2];
var material = new THREE.MeshFaceMaterial(materials);

module.exports.materialmap = materialmap;
module.exports.material = material;
