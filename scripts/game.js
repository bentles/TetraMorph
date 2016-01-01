//add ability to seed RNG to the math object
var seedrandom = require("./lib/seedrandom.min.js");

//the threejs library object
var THREE = require("./lib/three.min.js");

//internal dependencies
var materials = require("./materials");
var Config = require("./config.js");
var Backdrop = require("./backdrop.js");
var GameSquare = require("./gamesquare.js");
var Animation = require("./animation.js");
var Score = require("./score.js");
var State = require("./gamestate.js");
var Util = require("./utilities.js");

var camera, renderer, raycaster, mouseVector;
var backdrop;
var animationFrameID;
var seed;

//physics at 60fps
var dt = 1000 / Config.tps;

//stop right-click context menu from appearing. ever.
window.addEventListener('contextmenu', function(event) {
    event.preventDefault(); }, false);

function setup() {
    //clear the screen
    Util.switchToScreen(-1);

    //scene and camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 30000);
    camera.position.z = 1000;

    mouseVector = new THREE.Vector3();

    //lighting
    var light = new THREE.PointLight(0xffffff, 0.8);
    light.position.set(0.3, 0.2, 1).normalize();
    State.scene.add(light);

    //create the backdrop
    backdrop = new Backdrop(4, 4, 0x00CC00);
    backdrop.animateBreathe();

    //set up renderer
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        canvas: document.getElementById("canvas")
    });
    renderer.setSize(window.innerWidth, window.innerHeight);

    //create the player
    var player_game_square = new GameSquare(materials.material, materials.materialmap, 0);
    player_game_square.generateSquares();
    player_game_square.addX(-550);
    player_game_square.playerReset();
    State.add("player", player_game_square);

    //set up the scores
    var tscore = new Score("t", false, Config.light_colour, ["r1", "r2", "r3"], "right-tongue");
    var fscore = new Score("f", true, Config.dark_colour, ["l1", "l2", "l3"], "left-tongue");
    State.add("tscore", tscore);
    State.add("fscore", fscore);

    //add event listeners for mouse
    document.addEventListener('mousedown', onMouseDown, false);
    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('keydown', onKeyBoard, false);
    window.addEventListener('blur', onBlur, false);
}

function reSeed()
{
    //set up seed
    seed = Math.random();
    seedrandom(seed, {global: true});
}

function animate(time) {
    State.new_time = time || 0;

    if(State.paused)
    {
        State.current_time = State.new_time ;
        State.paused = false;
    }

    var elapsed_time = State.new_time - State.current_time;

    State.current_time = State.new_time;

    State.accumulator += elapsed_time;

    //loop if we can do more physics per render
    //don't do physics at all if not enough time has passed for another step
    //instead, render again
    while (State.accumulator >= dt) {
        gameLogic();
        State.accumulator -= dt;
    }

    renderer.render(State.scene, camera);

    animationFrameID = requestAnimationFrame(animate);
}

//start states for game variables
var multiplier = true;
var moving_forward_animation;

function gameLogic() {
    //console.log(State.scene.children.length);
    if (!State.lost) //while you are still alive the game goes on
    {
        var roundWon = (State.gs !== null) && (State.player.squareString === State.gs.squareString);
        if (roundWon) {
            moving_forward_animation.stop();
            gameSquareWin(State.gs, State.tscore, State.fscore);
            State.difficulty += 2;
            gameSquareAnimateWin();
            State.count_down_to_next_shape = 0.3 * Config.tps;
            State.gs = null; //marker for having won
        }

        if (State.count_down_to_next_shape === 0) {
            //need to play animation for losing if gs is not null by this point
            if (State.gs !== null) {
                moving_forward_animation.stop();
                gameSquareLose(State.gs, State.tscore, State.fscore);
                gameSquareAnimateLose();
            }

            //reset player square
            State.player.playerReset();

            //if the game has not just been lost, make the next game square
            if (!State.lost) {
                State.gs = new GameSquare(
                    materials.material,
                    materials.materialmap,
                    Math.floor(State.difficulty),
                    false);
                State.gs.generateSquares();

                //position the gamesquare
                State.gs.addX(550);
                State.gs.setZ(Config.start_pos);

                //animate the gamesquare
                moving_forward_animation = new Animation(function () {
                    var step = Math.abs(State.player.getZ() - Config.start_pos) / (Config.time_for_shape * Config.tps);
                    State.gs.addZ(step);
                    return false;
                });

                State.animationlist.push(moving_forward_animation);

                State.count_down_to_next_shape = Config.time_for_shape * Config.tps;
            }
        } else if (State.count_down_to_next_shape > 0) {
            //if they win before the end move on to the next animation
            //continue counting down
            State.count_down_to_next_shape--;
        }
    }


    /* Execute animations:
     * ===================
     * animationlist is a list of Animations whose play method returns true if complete
     * call each Animation's play method in turn and remove those that return true
     * this may or may not be a terrible way to do this that I regret later lol
     */
    var len = State.animationlist.length;
    while (len--) {
        var done = State.animationlist[len].playStep();
        if (done) {
            var nextAnims = State.animationlist[len].getNextAnis();
            State.animationlist.splice(len, 1);

            //Animations can have a list of successors which activate after an
            //animation is complete
            if (nextAnims.length > 0)
                nextAnims.forEach(function(x) {
                    State.animationlist.push(x);
                }, this);
        }
    }
}

function gameSquareWin(gs, tscore, fscore) {
    var scores = gs.getSquareStringDetails();
    tscore.add(scores.t);
    fscore.add(scores.f);
}

function gameSquareLose(gs, tscore, fscore) {
    var scores = gs.getSquareStringDetails();
    tscore.add(-scores.t);
    fscore.add(-scores.f);

    //game over
    var stats_div = document.getElementById("stats");

    stats_div.innerHTML = "<h3>Light Score : " +
        fscore.count + "</h3><h3>Dark Score: " + tscore.count +
        "</h3><h3>Difficulty Reached: " + State.difficulty +
        "</h3>"; //<h3>Refresh to play again</h3>";
    Util.switchToScreen(1); //game over
    State.lost = true;
}

function gameSquareAnimateWin() {
    var time = 0.6;
    var steps = Config.tps * 5;
    State.gs.squares.forEach(function(x) {
        x.animateMoveTo(new THREE.Vector3(0, -300, 700),
            new THREE.Vector2(20, 20),
            x.mesh.rotation, time, true);
    });
}

function gameSquareAnimateLose() {
    State.gs.squares.forEach(function(x) {
        x.animateFade(3, true);
    });

    //State.player.squares.forEach(function(x) {
    //    x.animateFade(3, true);
    //});
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.render(State.scene, camera);
}

function onMouseDown(e) {
    if (State.lost) {
        //gameReset();
    } else if (!State.active) {
        onFocus();
    } else //must be resumed by click before another click can do anything
    {
        mouseVector.x = 2 * (e.clientX / window.innerWidth) - 1;
        mouseVector.y = 1 - 2 * (e.clientY / window.innerHeight);

        var vector = new THREE.Vector3(mouseVector.x, mouseVector.y, 1).unproject(camera);

        raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
        var intersects = raycaster.intersectObjects(State.scene.children);

        if (intersects[0] && (intersects[0].object.shape !== undefined)) {
            if (e.button === 0 && e.shiftKey || e.button === 1)
                intersects[0].object.shape.requestMerge();
            else if (e.button === 0)
                intersects[0].object.shape.requestSplit();
            else if (e.button === 2)
                intersects[0].object.shape.flip();
        }
    }
}

function onKeyBoard(e) {
    e = e || window.event;
    if (e.keyCode === 27) {
        if (State.active)
            onBlur();
        else
            onFocus();
    } else if (e.keyCode === 32) {
        multiplier = !multiplier;
        State.tscore.toggleMultiplier();
        State.fscore.toggleMultiplier();
        backdrop.setColor(multiplier ? color2 : color1);
} else if (e.keyCode === 107)
    Config.breathe_speed += 0.001;
    else if (e.keyCode === 109)
        Config.breathe_speed -= 0.001;
}

function onFocus() {
    if (!State.active) //needed on firefox
    {
        State.active = true;
        document.getElementById("paused").style.display = "none";

        //implicitly reset State.paused
        requestAnimationFrame(animate);
    }
};

function onBlur() {
    if (State.active) //just to be safe
    {
        document.getElementById("seed_display").innerHTML = "seed: " + seed ;

        State.active = false;
        if (!State.lost)
            Util.switchToScreen(2);
        State.paused = true;
        cancelAnimationFrame(animationFrameID);
    }
};


function restartGame() {
    seedrandom(seed, {global: true});
    Util.switchToScreen(-1);
    cancelAnimationFrame(animationFrameID);
    State.reset();
    backdrop.animateBreathe();
    animationFrameID = requestAnimationFrame(animate);
}

function startGame() {
    reSeed();
    restartGame();
}

document.getElementById("new_game").addEventListener("click", startGame);
document.getElementById("retry").addEventListener("click", restartGame);
document.getElementById("main_menu").addEventListener("click", function(){Util.switchToScreen(0)});


setup();
Util.switchToScreen(0);

