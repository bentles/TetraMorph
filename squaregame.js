//these are out here for debug purposes
//all variables will be moved into main
var scene, camera, renderer, raycaster, projector, mouseVector;
var playermaterial, material, mesh, startpos, animationlist, materialmap, backdrop;
var animationFrameID;
var breathespeed = 0.005;

//player's GameSquare
var playerGameSquare;

//pausing and resuming
var pausedTime = 0;
var active = true;

//display constants
var gap = 10;
var depth = 5;

//physics at 60fps
var tps = 60; //ticks per second
var dt = 1000/tps;
var currentTime = 0, newTime = 0;
var accumulator = 0;

function main()
{
    function init() {
	//not sure why but if i start off with none it never appears :/
	document.getElementById("paused").style.display = "none";
	
	//scene and camera
	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 30000 );
	camera.position.z = 1000;
	
	projector = new THREE.Projector();
	mouseVector = new THREE.Vector3();

	//lighting
	var light = new THREE.PointLight( 0xffffff, 0.8 );
	light.position.set( 0.3, 0.2, 1 ).normalize();
	scene.add( light );
	
	//keep track of what's being animated
	animationlist = [];
	
	//work out shapes and materials
	var frontmaterial = new THREE.MeshBasicMaterial({transparent:true, color: 0x33CC33, shininess:50, vertexColors:THREE.FaceColors} );
	var sidematerial= new THREE.MeshBasicMaterial({transparent:true, color: 0x123123, shininess:50, vertexColors:THREE.FaceColors} );
	var backmaterial = new THREE.MeshBasicMaterial({transparent:true, color: 0x145214, shininess:50, vertexColors:THREE.FaceColors} );
	var materials = [frontmaterial, sidematerial, backmaterial];

	materialmap = [1,1,1,1,1,1,1,1,0,0,2,2];
	
	playermaterial = new THREE.MeshFaceMaterial(materials);
	material = new THREE.MeshFaceMaterial(materials);

	//create the backdrop
	backdrop = new Backdrop(4, 4, 0x00CC00);
	backdrop.animateBreathe();
	
	//player
	playerGameSquare = new GameSquare(playermaterial, 0);
	playerGameSquare.generateSquares();
	playerGameSquare.addX(-550);
	playerGameSquare.playerReset();

	//set up renderer
	renderer = new THREE.WebGLRenderer({antialias:true});
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );

	//add event listeners for mouse
	document.addEventListener('mousedown', onMouseDown, false);
	window.addEventListener('resize', onWindowResize, false);
	window.addEventListener('keydown', onKeyBoard, false);
	window.addEventListener('blur', onBlur, false);
	window.addEventListener('contextmenu', function ( event ) { event.preventDefault(); }, false );
    }


    function animate(time) {
	animationFrameID = requestAnimationFrame( animate );

	newTime = time || 0;
	
	var elapsedTime = newTime - currentTime;

	if (pausedTime > 0) //game has recently been paused
	{
	    elapsedTime -= pausedTime;
	    pausedTime = 0;
	}
	
	//console.log(time);
	currentTime = newTime;
	
	accumulator += elapsedTime;
	//console.log(accumulator);
	//controls.update();// <-- does this do anything?

	//loop if we can do more physics per render
	//don't do physics at all if not enough time has passed for another step
	//instead, render again
	while (accumulator >= dt) 
	{
	    gameLogic();
	    accumulator -= dt;
	}

	//TODO add interpolation somehow
	renderer.render( scene, camera );	
    }
    var color1 = 0x145214;
    var color2 = 0x33CC33;
    var tscore = new Score(0, "t", false, color1, ["r1", "r2", "r3"], "right-tongue");
    var fscore = new Score(0, "f", true, color2, ["l1", "l2", "l3"], "left-tongue");
    var timeForShape = 10; //seconds
    var countDownToNextShape = 0;
    var startpos = -10000;
    var difficulty = 3;
    var multiplier = true;
    function gameLogic()
    {
	//make new shapes that fly towards the screen every timeForShape seconds
	if (countDownToNextShape > 0)	
	    countDownToNextShape--;	
	else if(countDownToNextShape === 0)
	{
	    //make an uneditable gamesquare
	    var gs = new GameSquare(material, Math.floor(difficulty), false); 
	    gs.generateSquares();	    

	    //position the gamesquare
	    gs.addX(550);
	    gs.setZ(startpos);

	    //animate gs, each animation calls the next as needed
	    animationlist.push(gameSquareMoveAniGen(playerGameSquare, gs));
	    
	    countDownToNextShape = timeForShape*tps;		
	}	

	/*Execute animations
	 *==================
	 *animationlist is a list of functions that return true if complete
	 *call each function in turn and remove those that return true
	 *this may or may not be a terrible way to do this that I regret later lol
	 */
	var len = animationlist.length;
	    while(len--)
	    {
		var done = animationlist[len]();
		if (done)		
		    animationlist.splice(len,1);
	    }
    }

    function gameSquareMoveAniGen(playergs, gs)
    {
	return function(){
	    if (countDownToNextShape  > 0)
	    {
		var step = Math.abs(playergs.getZ() - startpos)/(timeForShape*tps);
		gs.addZ(step);

		//if they win before the end move on to the next animation
		if (playergs.squareString === gs.squareString)
		{
		    gameSquareCompleteAniGen(playergs, gs);
		    return true;
		}		
		return false;
	    }
	    else
	    {
		//TODO: change this
		gameSquareCompleteAniGen(playergs, gs);
		return true;
	    }
	};
    }

    function gameSquareCompleteAniGen(playergs, gs)
    {
	var resetTime = 0.5;
	var steps = tps*5;
	var won = (playergs.squareString === gs.squareString);
	var scores = playergs.getSquareStringDetails();
	
	if (won)
	{
	    difficulty += 0.1;

	    var diffdecimal = difficulty - Math.floor(difficulty);
	    //TODO use ^ for something
	    
	    tscore.add(scores.t);
	    fscore.add(scores.f);

	    //reset player and get next shape going at the end of the animation so that you can see the last move
	    //careful. callbacks happen for all squares. only works because animations end at the same time
	    countDownToNextShape = -1;
	    gs.squares.forEach(function(x){
		x.animateMoveTo(new THREE.Vector3(0, -300, 700), new THREE.Vector2(200,200),
				x.mesh.rotation, resetTime, true,
				function(){playergs.playerReset(); countDownToNextShape = 0;});});	   
	}
	else
	{
	    playergs.playerReset();
	    gs.squares.forEach(function(x){
		x.animateFade(3,true);
	    });
	}
    }

    function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.render(scene, camera);
    }

    function onMouseDown(e)
    {
	if (!active)
	{
	    onFocus();
	}
	else //must be resumed by click before another click can do anything
	{	    
	    mouseVector.x = 2*(e.clientX / window.innerWidth) -1 ;
	    mouseVector.y = 1 - 2 * ( e.clientY / window.innerHeight );

	    var vector = new THREE.Vector3( mouseVector.x, mouseVector.y, 1 ).unproject( camera );

	    raycaster = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );
	    var intersects = raycaster.intersectObjects(scene.children);

	    if (intersects[0] && (intersects[0].object.shape !== undefined))
	    {
		if (e.button === 0 && e.shiftKey || e.button === 1)		
		    intersects[0].object.shape.requestMerge();		
		else if (e.button === 0)		
		    intersects[0].object.shape.requestSplit();
		else if (e.button === 2)		
		    intersects[0].object.shape.flip();
	    }
	}
    }

    function onKeyBoard(e){
	e = e || window.event;
	if (e.keyCode === 27)
	{
	    if (active)
		onBlur();
	    else
		onFocus();
	}
	else if (e.keyCode === 32)
	{
	    multiplier = !multiplier;
	    
	    tscore.toggleMultiplier();
	    fscore.toggleMultiplier();
	    backdrop.setColor(multiplier? color2: color1);
	}
	else if (e.keyCode === 107)
	    breathespeed += 0.001;
	else if (e.keyCode === 109)
	    breathespeed -= 0.001;

	console.log(breathespeed);
    }
    function onFocus()
    {
	if (!active) //needed on firefox
	    {
		active = true;
		document.getElementById("paused").style.display = "none";
		pausedTime = Date.now() - pausedTime;
		requestAnimationFrame(animate);
	    }
    };
    function onBlur()
    {
	if (active) //just to be safe
	    {
		active = false;
		document.getElementById("paused").style.display = "block";
		pausedTime = Date.now();
		cancelAnimationFrame(animationFrameID);
	    }
    }; 
 
    
    init();
    animate();
}


