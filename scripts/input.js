/*
 * This file will be used to move a lot of code out of game.js. Our strategy is to use browser 
 * mouse/keyboard events to update values in the GameState and then read those values every 
 * physics/logic iteration of the game. This way we know exactly when the input is read.
 */

var State = require("./gamestate.js");
var THREE = require("./lib/three.min.js");
var Config = require("./config.js");
var Types = require("./types.js");
var Util = require("./utilities.js");

function init() {
    //add event listeners for mouse
    document.addEventListener('mousedown', onMouseDown, false);
    document.addEventListener('mousemove', onMouseMove, false);
    window.addEventListener('keydown', onKeyboard, false);
     //stop right-click context menu from appearing. ever.
    window.addEventListener('contextmenu', function(event) {
        event.preventDefault(); }, false);


}

function onMouseDown(e) {
    State.mouse_button = e.button;
}

function onMouseMove(e) {
    //save mouse coords and what objects a ray from the mouse pos intersect into GameState
    
    State.mouse_pos.x = 2 * (e.clientX / window.innerWidth) - 1;
    State.mouse_pos.y = 1 - 2 * (e.clientY / window.innerHeight);

    //reuse these instead of GC?
    var vector = new THREE.Vector3(State.mouse_pos.x, State.mouse_pos.y, 1).unproject(State.camera);
    var raycaster = new THREE.Raycaster(State.camera.position, vector.sub(State.camera.position).normalize());
    State.looking_at = raycaster.intersectObjects(State.scene.children);
}

function reset() {
    //reset the state of variables whose state may no longer be valid    
    State.mouse_button = undefined;
}

function handleInput() {
    //highlight when the mouse is over a space:    
    //unhighlight spaces from previous frame
    for(var i = State.changed.length - 1; i >= 0; i--) {
        var ch = State.changed.pop();
        ch.material.color = new THREE.Color( Config.normal_colour );
        ch.material.opacity = Config.normal_opacity;
    }

    var intersects = State.looking_at[0];

    //set spaces currently under the mouse to the highlight colour
    if (intersects && intersects.object.shape &&
        intersects.object.shape.getType() === Types.Space) {
        //TODO: solve this with duck typing again... use highlight
        //and unhighlight and then we can highlight squares too :)
        
        intersects.object.shape.mesh.material.color =
            new THREE.Color( Config.highlight_colour );            
        intersects.object.shape.mesh.material.opacity = Config.highlight_opacity;            
        State.changed.push(intersects.object.shape.mesh);
    }

    //when the mouse is clicked:
    if (State.mouse_button !== undefined) {
        //TODO: something something state machine???
        if (!State.active) {
            onFocus();
        } else //must be resumed by click before another click can do anything
        {
            if (intersects[0] && (intersects[0].object.shape)) {
                if (State.mouse_button === 1)
                    intersects[0].object.shape.requestMerge();
                else if (State.mouse_button === 0)
                    intersects[0].object.shape.requestSplit();
                else if (State.mouse_button === 2)
                    intersects[0].object.shape.flip();
            }
        }
    }
}

function onKeyboard(e) {
    e = e || window.event;
    if (e.keyCode === 27) {
        if (State.active)
            onBlur();
        else
            onFocus();
    }
}
