//add ability to seed RNG to the math object
var seedrandom = require("./lib/seedrandom.min.js");

//the threejs library object
var THREE = require("./lib/three.min.js");

//internal dependencies
var materials = require("./materials.js");
var Config = require("./config.js");
var Backdrop = require("./backdrop.js");
var GameSquare = require("./gamesquare.js");
var Animation = require("./animation.js");
var Score = require("./score.js");
var State = require("./gamestate.js");
var Util = require("./utilities.js");
var Types = require("./types.js");

var camera, renderer, raycaster, mouseVector, composer;
var backdrop;
var animationFrameID;

//physics at 60fps
//this implies 1000 / 60 milliseconds have passed for each frame
var physics_step = 1000 / Config.tps;

function setup() {
    //TODO: move me pls!! (possibly add animations)
    //create a simple effect to give a sense of depth
    var squareCount = 30;
    
    for(var i = 1; i <= squareCount; i++) {
        var a = new THREE.BoxGeometry(Config.gap, Config.gap, Config.gap);
        var b = materials.simple_material;

        var z = Config.start_pos + ((1000 -Config.start_pos) / squareCount) * i  ;
        var mesh = new THREE.Mesh(a,b);
        mesh.position.x = 550;
        mesh.position.y = 0;
        mesh.position.z = z;
        State.scene.add(mesh);

        var frames = 0;
    }
    
    //get canvas
    var canvas =  document.getElementById("canvas");
   
    //scene and camera
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 30000);
    camera.position.z = Config.camera_z;

    mouseVector = new THREE.Vector3();

    //lighting
    var light = new THREE.DirectionalLight(0xffffff, 0.9);
    light.position.set(0.1, 0.1, 1).normalize();
    State.scene.add(light);

    //create the backdrop
    backdrop = new Backdrop(2, 4, 0x00CC00);
    backdrop.animateBreathe();

    //set up renderer
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        canvas: canvas
    });
    renderer.setSize(window.innerWidth, window.innerHeight);

    //set up post processing for pause screen
    composer = new THREE.EffectComposer(renderer);
    composer.addPass( new THREE.RenderPass(State.scene, camera));
    var hblur = new THREE.ShaderPass(THREE.HorizontalBlurShader);
    hblur.uniforms.h = {type:"f", value:15/window.innerWidth};
    composer.addPass(hblur);
    var vblur = new THREE.ShaderPass(THREE.VerticalBlurShader);
    vblur.uniforms.v = {type:"f", value:15/window.innerHeight};
    vblur.renderToScreen = true; //want to see it after 2nd pass
    composer.addPass( vblur );

    //create the player
    var player_gamesquare = new GameSquare(materials.material, materials.materialmap, 0);
    player_gamesquare.generateSquares();
    player_gamesquare.addX(Config.player_x_offset);
    player_gamesquare.playerReset();
    State.add("player", player_gamesquare);

    //set up the scores
    var score = new Score("score", Config.light_colour, "score: ");
    State.add("score", score);

    var onMouseMove = onMouseMoveGenerator();
    //add event listeners for mouse
    document.addEventListener('mousedown', onMouseDown, false);
    document.addEventListener('mousemove', onMouseMove, false);
    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('keydown', onKeyBoard, false);
    window.addEventListener('blur', onBlur, false);

    //stop right-click context menu from appearing. ever.
    window.addEventListener('contextmenu', function(event) {
        event.preventDefault(); }, false);
}

function reSeed()
{
    //set up seed
    State.seed = Math.random();
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

    //physics run at 60fps
    //loop if we can do more physics per render
    //don't do physics at all if not enough time has passed for another step
    //instead, render again
    while (State.accumulator >= physics_step) {
        gameLogic();
        State.accumulator -= physics_step;
        //animations contain integration... so physics so they should happen at fixed 60fps
        processAnimations(State.accumulator);
    }

    //rendering should be as fast as possible (though the browser usually chooses 60fps)
    renderer.render(State.scene, camera);

    animationFrameID = requestAnimationFrame(animate);
}

var moving_forward_animation;

function processAnimations(accumulator) {
    /* Execute animations:
     * ===================
     * animationlist is a list of Animations whose play method returns true if complete
     * call each Animation's play method in turn and remove those that return true
     * this may or may not be a terrible way to do this that I regret later lol
     */
    var len = State.animationlist.length;
    while (len--) {
        var done = State.animationlist[len].playStep(accumulator);
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

function gameLogic() {
    //gameLogic assumes the fixed physics_step
    
    //console.log(State.scene.children.length);
    if (!State.lost) //while you are still alive the game goes on
    {
        var roundWon = (State.gs !== null) && (State.player.squareString === State.gs.squareString);
        if (roundWon) {
            moving_forward_animation.stop();
            gameSquareWin(State.gs, State.score);
            State.difficulty += 2;
            State.gs.animateWin();
            backdrop.animateWin();
            State.count_down_to_next_shape = 0.3 * Config.tps;
            
            //clear the gamesquares
            //State.gs.clearSquares();
            State.gs = null; //marker for having won
        }

        if (State.count_down_to_next_shape === 0) {
            //need to play animation for losing if gs is not null by this point
            if (State.gs !== null) {
                moving_forward_animation.stop();
                gameSquareLose(State.score);
                State.gs.animateLose();
            }
            
            //if the game has not just been lost, make the next game square
            if (!State.lost) {
                //reset player square
                State.player.playerReset();                 
                
                State.gs = new GameSquare(
                    materials.material,
                    materials.materialmap,
                    Math.floor(State.difficulty),
                    false);
                State.gs.generateSquares();

                //position the gamesquare
                State.gs.addX(Config.gamesquare_x_offset);
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
}

function gameSquareWin(gs, score) {
    var scores = gs.getSquareStringDetails();
    score.add(scores.t + scores.f);
}

function gameSquareLose(score) {
    //game over
    var stats_div = document.getElementById("stats");

    stats_div.innerHTML =
        "<h3>Score: " + score.count +
        "</h3><h3>Difficulty Reached: " + State.difficulty +
        "</h3>"; //<h3>Refresh to play again</h3>";
    switchToScreen(1); //game over
    State.lost = true;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.render(State.scene, camera);
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

        if (intersects[0] && (intersects[0].object.shape)) {
            if (e.button === 0 && e.shiftKey || e.button === 1)
                intersects[0].object.shape.requestMerge();
            else if (e.button === 0)
                intersects[0].object.shape.requestSplit();
            else if (e.button === 2)
                intersects[0].object.shape.flip();
        }
    }
}

function onMouseMoveGenerator() {
    //keep track of which spaces we have changed (will probably only ever be 1 element)
    var changed = [];
    
    return function(e) {        
        //pop items off the list and reset their colour
        for(var i = changed.length - 1; i >= 0; i--) {
            var ch = changed.pop();
            ch.material.color = new THREE.Color( Config.normal_colour );
            ch.material.opacity = Config.normal_opacity;
        }

        //make spaces change colour when mousing over
        mouseVector.x = 2 * (e.clientX / window.innerWidth) - 1;
        mouseVector.y = 1 - 2 * (e.clientY / window.innerHeight);
        
        var vector = new THREE.Vector3(mouseVector.x, mouseVector.y, 1).unproject(camera);
        raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
        var intersected = raycaster.intersectObjects(State.scene.children)[0];

        //set anything currently under the mouse to the highlight colour
        if (intersected && intersected.object.shape &&
            intersected.object.shape.getType() === Types.Space) {
            
            intersected.object.shape.mesh.material.color =
                new THREE.Color( Config.highlight_colour );            
            intersected.object.shape.mesh.material.opacity = Config.highlight_opacity;            
            changed.push(intersected.object.shape.mesh);
        }
    };
}

function onKeyBoard(e) {
    e = e || window.event;
    if (e.keyCode === 27) {
        if (State.active)
            onBlur();
        else
            onFocus();
}

function onFocus() {
    if (!State.active) //needed on firefox
    {
        State.active = true;
        switchToScreen(4);

        //implicitly reset State.paused
        requestAnimationFrame(animate);
    }
}

function onBlur() {
    if (State.active && State.current_screen === 4) //just to be safe && only on game screen
    {
        document.getElementById("seed-display").innerHTML = "seed: " + State.seed ;
        composer.render(State.scene, camera);
        State.active = false;
        if (!State.lost)
            switchToScreen(2);
        State.paused = true;
        cancelAnimationFrame(animationFrameID);
    }
}

function restartGame() {
    cancelAnimationFrame(animationFrameID);
    switchToScreen(4);
    State.reset();
    backdrop.animateBreathe();
    animationFrameID = requestAnimationFrame(animate);
}

function startGame() {
    reSeed();
    restartGame();
}

function startWithSeed() {
    var value = document.getElementById("seed-value").value; 
    State.seed = Number.parseFloat(value) || value || "competitive";
    restartGame();
}

function switchToScreen(screen)
{
    Util.showScreen(screen);
    State.current_screen = screen;
}

function addEventListenerByClass(className, eventName, func) {
    var elements = document.getElementsByClassName(className);

    for(var i = 0; i < elements.length; i++) {
        elements[i].addEventListener(eventName, func);
    }
}


document.getElementById("new-game").
    addEventListener("click",
                     function() {
                         Config.time_for_shape = 7;
                         startGame();});
document.getElementById("ez-mode").
    addEventListener("click",
                     function() {
                         Config.time_for_shape = 70;
                         startGame();});
document.getElementById("retry").addEventListener("click", restartGame);
addEventListenerByClass("main-menu", "mousedown", function(){switchToScreen(0);});
document.getElementById("enter-seed").
    addEventListener("click", function(){switchToScreen(3);
                                         document.getElementById("seed-value").focus();});
document.getElementById("start-seeded").addEventListener("click", startWithSeed);
document.getElementById("back").addEventListener("click", function(){switchToScreen(0);});
document.getElementById("seed-display").addEventListener("mousedown", function(e) {e.stopPropagation();});

setup();
switchToScreen(0);

