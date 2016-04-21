module.exports = {
    //game config
    tps : 60,                    // ticks per second
    time_for_shape : 7,
    init_difficulty : 30,
	gamesquare_size: 1000,
	split_depth: 4,              // how many times you can split the first squre

    //aesthetics config
    breathe_speed : 0.005,       // background animation speed
    start_pos : -5000,           // how far away the square starts
    gap: 25,                     // space between squares
    depth: 5,                    // how deep the squares are in the z direction
    small_font : "20pt",         // font sizes of scores
    large_font : "30pt",
    score_animation_time : 0.5,  // time (s) for the score animation
    light_colour : 0x00B500,
    dark_colour : 0x145214,
	side_colour : 0x123123,
	camera_z : 800,
	player_x_offset : -550,
	gamesquare_x_offset : 550
};
