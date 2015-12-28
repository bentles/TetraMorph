var THREE = require("./lib/three.min.js");

//work out shapes and materials
var frontmaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    color: 0x33CC33,
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
    color: 0x145214,
    shininess: 50,
    vertexColors: THREE.FaceColors
});
var materials = [frontmaterial, sidematerial, backmaterial];

var materialmap = [1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 2, 2];
var material = new THREE.MeshFaceMaterial(materials);

module.exports.materialmap = materialmap;
module.exports.material = material;
