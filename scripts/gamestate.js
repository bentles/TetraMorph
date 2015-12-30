var THREE = require("./lib/three.min.js");
var Config = require("./config.js");
var Util = require("./utilities.js")

var game_state = {
    scene : new THREE.Scene(),
    animationlist : [],

    //time related vars
    current_time : 0,
    new_time : 0,
    accumulator : 0,

    // state flags
    paused : true,
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
    //players and animations
    game_state.player.playerReset();
    game_state.gs.clearSquares();
    game_state.gs = null;
    game_state.animationlist = [];

    //time
    game_state.paused = true;
    game_state.current_time = 0;
    game_state.new_time = 0;
    game_state.accumulator = 0;

    game_state.lost = false;
    game_state.active = true;

    //creating the game squares
    game_state.count_down_to_next_shape = 0;
    game_state.difficulty = Config.init_difficulty;
}

function add(name, value) {
    game_state[name] = value;
}

module.exports = game_state ;