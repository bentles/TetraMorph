var THREE = require("./lib/three.min.js");
var Config = require("./config.js");

//game square materials
var frontmaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    color: Config.light_colour,
    shininess: 50,
    vertexColors: THREE.FaceColors
});
var sidematerial = new THREE.MeshBasicMaterial({
    transparent: true,
    color: Config.side_colour,
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

module.exports.simple_material = new THREE.MeshLambertMaterial({
    transparent: true,
    color: 0x333399,
    opacity: 0.5,
    shininess: 50,
    vertexColors: THREE.FaceColors
});
module.exports.simple_material2 = new THREE.MeshPhongMaterial({
    shading: THREE.FlatShading,
    transparent: true,
    color: Config.normal_colour,
    opacity: Config.normal_opacity,
    shininess: 50,
    vertexColors: THREE.FaceColors
});

module.exports.materialmap = materialmap;
module.exports.material = material;
