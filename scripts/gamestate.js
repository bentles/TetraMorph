var THREE = require("./lib/three.min.js");
var Config = require("./config.js");

var game_state = {
    scene : new THREE.Scene(),
    animationlist : [],

    //time related vars
    paused_time : 0,
    current_time : 0,
    new_time : 0,
    accumulator : 0,

    // state flags
    lost : false,
    active : true,

    //creating the game squares
    count_down_to_next_shape : 0,
    difficulty : Config.init_difficulty,
    gs : null,

    //reference to the reset function
    reset : reset,
    add : add
};

function reset() {
    game_state.scene = new THREE.Scene();
    game_state.animationlist = [];
}

function add(name, value) {
    game_state[name] = value;
}

module.exports = game_state ;