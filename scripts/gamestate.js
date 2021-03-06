var THREE = require("./lib/three.min.js");
var Config = require("./config.js");
var Seedrandom = require("./lib/seedrandom.min.js");

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

    //current_screen
    current_screen : 4,

    //seeded random number generator
    seed : Math.random(),
    rng : Seedrandom(seed),

    //reference to the reset function
    reset : reset,
    add : add
};

//puts everything in order for a new game
function reset() {
    game_state.current_screen = 4;

    game_state.rng = Seedrandom(game_state.seed);

    //players and animations
    game_state.player.playerReset();
    if (game_state.gs != null)
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

    game_state.score.reset();
}

function add(name, value) {
    game_state[name] = value;
}

module.exports = game_state ;
