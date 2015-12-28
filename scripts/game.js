//add ability to seed RNG to the math object
require("./lib/seedrandom.min.js");

//the threejs library object
var THREE = require("./lib/three.min.js");

//internal dependencies
var materials = require("./materials");
var Config = require("./config.js");
var Backdrop = require("./backdrop.js");
var GameSquare = require("./gamesquare.js");
var Animation = require("./animation.js");
var Score = require("./score.js");
var GameState = require("./gamestate.js");

var camera, renderer, raycaster, mouseVector;
var backdrop;
var animationFrameID;

var screens = ["gamestart", "gameover", "paused", "seed"];

//player's GameSquare
var playerGameSquare;

//pausing and resuming
var pausedTime = 0;
var active = true;

//physics at 60fps

var dt = 1000 / Config.tps;
var currentTime = 0,
    newTime = 0;
var accumulator = 0;

//game state
var lost = false;

function init() {
    //not sure why but if i start off with none in css it never appears :/
    switchToScreen(0);

    //set up seed
    var seed = Math.random();
    Math.seedrandom(seed);

    //scene and camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 30000);
    camera.position.z = 1000;

    mouseVector = new THREE.Vector3();

    //lighting
    var light = new THREE.PointLight(0xffffff, 0.8);
    light.position.set(0.3, 0.2, 1).normalize();
    GameState.scene.add(light);

    //create the backdrop
    backdrop = new Backdrop(4, 4, 0x00CC00);
    backdrop.animateBreathe();

    //player
    playerGameSquare = new GameSquare(materials.material, materials.materialmap, 0);
    playerGameSquare.generateSquares();
    playerGameSquare.addX(-550);
    playerGameSquare.playerReset();

    //set up renderer
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        canvas: document.getElementById("canvas")
    });
    renderer.setSize(window.innerWidth, window.innerHeight);

    //add event listeners for mouse
    document.addEventListener('mousedown', onMouseDown, false);
    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('keydown', onKeyBoard, false);
    window.addEventListener('blur', onBlur, false);
    window.addEventListener('contextmenu', function(event) {
        event.preventDefault();
    }, false);
}

function animate(time) {
    animationFrameID = requestAnimationFrame(animate);

    newTime = time || 0;

    var elapsedTime = newTime - currentTime;

    if (pausedTime > 0) //game has recently been paused
    {
        elapsedTime -= pausedTime;
        pausedTime = 0;
    }
    currentTime = newTime;

    accumulator += elapsedTime;

    //loop if we can do more physics per render
    //don't do physics at all if not enough time has passed for another step
    //instead, render again
    while (accumulator >= dt) {
        gameLogic();
        accumulator -= dt;
    }

    //TODO add interpolation somehow
    renderer.render(GameState.scene, camera);
}

//score setup
var color1 = 0x145214;
var color2 = 0x33CC33;
var tscore = new Score("t", false, color1, ["r1", "r2", "r3"], "right-tongue");
var fscore = new Score("f", true, color2, ["l1", "l2", "l3"], "left-tongue");

//start states for game variables
var timeForShape = Config.time_for_shape; //seconds
var countDownToNextShape = 0;
var start_pos = Config.start_pos;
var difficulty = Config.init_difficulty;
var multiplier = true;
var gs = null;
var movingForwardAnimation;

function gameLogic() {
    if (!lost) //while you are still alive the game goes on
    {
        var roundWon = (gs !== null) && (playerGameSquare.squareString === gs.squareString);
        if (roundWon) {
            movingForwardAnimation.stop();
            gameSquareWin(gs, tscore, fscore);
            difficulty += 2;
            gameSquareAnimateWin();
            countDownToNextShape = 0.3 * Config.tps;
            gs = null; //marker for having won
        }

        if (countDownToNextShape === 0) {
            //need to play animation for losing if gs is not null by this point
            if (gs !== null) {
                movingForwardAnimation.stop();
                gameSquareLose(gs, tscore, fscore);
                gameSquareAnimateLose();
            }

            //reset player square
            playerGameSquare.playerReset();

            //make an uneditable gamesquare
            gs = new GameSquare(materials.material, materials.materialmap, Math.floor(difficulty), false);
            gs.generateSquares();

            //position the gamesquare
            gs.addX(550);
            gs.setZ(start_pos);

            //animate the gamesquare
            movingForwardAnimation = new Animation(function() {
                var step = Math.abs(playerGameSquare.getZ() - start_pos) / (timeForShape * Config.tps);
                gs.addZ(step);
                return false;
            });

            GameState.animationlist.push(movingForwardAnimation);

            countDownToNextShape = timeForShape * Config.tps;
        } else if (countDownToNextShape > 0) {
            //if they win before the end move on to the next animation
            //continue counting down
            countDownToNextShape--;
        }
    }


    /* Execute animations:
     * ===================
     * animationlist is a list of Animations whose play method returns true if complete
     * call each Animation's play method in turn and remove those that return true
     * this may or may not be a terrible way to do this that I regret later lol
     */
    var len = GameState.animationlist.length;
    while (len--) {
        var done = GameState.animationlist[len].playStep();
        if (done) {
            var nextAnims = GameState.animationlist[len].getNextAnis();
            GameState.animationlist.splice(len, 1);

            //Animations can have a list of successors which activate after an
            //animation is complete
            if (nextAnims.length > 0)
                nextAnims.forEach(function(x) {
                    GameState.animationlist.push(x);
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
    var gameOverDiv = document.getElementById("gameover");

    gameOverDiv.innerHTML = "<h1>Game Over</h1><h2>Light Score : " +
        fscore.count + "</h2><h2>Dark Score: " + tscore.count +
        "</h2><h2>Difficulty Reached: " + difficulty +
        "</h2>"; //<h3>Refresh to play again</h3>";
    switchToScreen(1); //game over 
    lost = true;
}

function gameSquareAnimateWin() {
    var time = 0.6;
    var steps = Config.tps * 5;
    gs.squares.forEach(function(x) {
        x.animateMoveTo(new THREE.Vector3(0, -300, 700), new THREE.Vector2(20, 20),
                        x.mesh.rotation, time, true);
    });
}

function gameSquareAnimateLose() {
    gs.squares.forEach(function(x) {
        x.animateFade(3, true);
    });
}


function gameReset() {
    lost = false;
    init();
    animate();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.render(GameState.scene, camera);
}

function onMouseDown(e) {
    if (lost) {
        gameReset();
    } else if (!active) {
        onFocus();
    } else //must be resumed by click before another click can do anything
    {
        mouseVector.x = 2 * (e.clientX / window.innerWidth) - 1;
        mouseVector.y = 1 - 2 * (e.clientY / window.innerHeight);

        var vector = new THREE.Vector3(mouseVector.x, mouseVector.y, 1).unproject(camera);

        raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
        var intersects = raycaster.intersectObjects(GameState.scene.children);

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
        if (active)
            onBlur();
        else
            onFocus();
    } else if (e.keyCode === 32) {
        multiplier = !multiplier;

        tscore.toggleMultiplier();
        fscore.toggleMultiplier();
        backdrop.setColor(multiplier ? color2 : color1);
    } else if (e.keyCode === 107)
        Config.breathespeed += 0.001;
    else if (e.keyCode === 109)
        Config.breathespeed -= 0.001;
}

function onFocus() {
    if (!active) //needed on firefox
    {
        active = true;
        document.getElementById("paused").style.display = "none";
        pausedTime = Date.now() - pausedTime;
        requestAnimationFrame(animate);
    }
};

function onBlur() {
    if (active) //just to be safe
    {
        active = false;
        if (!lost)
            switchToScreen(2);
        pausedTime = Date.now();
        cancelAnimationFrame(animationFrameID);
    }
};

function switchToScreen(screenNumber) {
    for (var i = 0; i < screens.length; i++) {
        document.getElementById(screens[i]).style.display = (i === screenNumber) ? "block" : "none";
    }
}

init();
animate();

