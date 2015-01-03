//these are out here for debug purposes
//all variables will be moved into main
var scene, camera, renderer, raycaster, material, mouseVector;
var playermaterial, startpos, animationlist, materialmap, backdrop;
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

//game state
var lost = false;

function main()
{
    function init() {
	//not sure why but if i start off with none in css it never appears :/
	document.getElementById("paused").style.display = "none";
	document.getElementById("gameover").style.display = "none";

	//set up seed
	var seed =  Math.random();
	Math.seedrandom(seed);
	
	//scene and camera
	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 30000 );
	camera.position.z = 1000;
	
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
	renderer = new THREE.WebGLRenderer({antialias:true, canvas:document.getElementById("canvas")});
	renderer.setSize( window.innerWidth, window.innerHeight );

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
	currentTime = newTime;
	
	accumulator += elapsedTime;

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
    
    //score setup
    var color1 = 0x145214;
    var color2 = 0x33CC33;
    var tscore = new Score("t", false, color1, ["r1", "r2", "r3"], "right-tongue");
    var fscore = new Score("f", true, color2, ["l1", "l2", "l3"], "left-tongue");

    //start states for game variables
    var timeForShape = 10; //seconds
    var countDownToNextShape = 0;
    var startpos = -10000;
    var difficulty = 3;
    var multiplier = true;
    var gs = null;
    var movingForwardAnimation;
    
    function gameLogic()
    {
	if (!lost) //while you are still alive the game goes on
	{
	    var roundWon = (gs !== null) && (playerGameSquare.squareString === gs.squareString);	    
	    if (roundWon)
	    {
		movingForwardAnimation.stop();
		gameSquareWin(gs, difficulty, tscore, fscore);
		gameSquareAnimateWin();
		countDownToNextShape = 0.3*tps;
		gs = null; //marker for having won
	    }

	    if(countDownToNextShape === 0)
	    {
		//need to play animation for losing if gs is not null by this point
		if (gs !== null)
		{
		    movingForwardAnimation.stop();
		    gameSquareLose(gs, tscore, fscore);
		    gameSquareAnimateLose();
		}
		
		//reset player square
		playerGameSquare.playerReset();
		
		//make an uneditable gamesquare
		gs = new GameSquare(material, Math.floor(difficulty), false); 
		gs.generateSquares();
	
		//position the gamesquare
		gs.addX(550);
		gs.setZ(startpos);

		//animate the gamesquare
		movingForwardAnimation = new Animation(function(){
		    var step = Math.abs(playerGameSquare.getZ() - startpos)/(timeForShape*tps);
		    gs.addZ(step);
		    return false;
		});
		
		animationlist.push(movingForwardAnimation);
		
		countDownToNextShape = timeForShape*tps;		
	    }
	    else if (countDownToNextShape > 0)
	    {
		//if they win before the end move on to the next animation
		//continue counting down
		countDownToNextShape--;
	    }	    
	}

	/*
	 *Execute animations
	 *animationlist is a list of Animations whose play method returns true if complete
	 *call each Animation's play method in turn and remove those that return true
	 *this may or may not be a terrible way to do this that I regret later lol
	 */
	var len = animationlist.length;
	while(len--)
	{
	    var done = animationlist[len].playStep();
	    if (done)		
		animationlist.splice(len,1);
	}
    }

    function gameSquareWin(gs, difficulty, tscore, fscore)
    {
	var scores = gs.getSquareStringDetails();
	difficulty += 0.1;
	
	tscore.add(scores.t);
	fscore.add(scores.f);
    }

    function gameSquareLose(gs, tscore, fscore)
    {
	var scores = gs.getSquareStringDetails();
	tscore.add(-scores.t);
	fscore.add(-scores.f);
	
	//game over
	if (fscore.lost() || tscore.lost())
	{
	    var gameOverDiv = document.getElementById("gameover");
	    gameOverDiv.style.display = "block";
	    gameOverDiv.innerHTML = "<h1>Game Over</h1><h2>Max Light Score : " + fscore.maxCount
		+ "</h2><h2>Max Dark Score: " + tscore.maxCount
		+ "</h2><h2>Difficulty Reached: " + difficulty + "</h2><h1>Refresh to play again</h1>";
	    lost = true;
	}
    }
    
    function gameSquareAnimateWin()
    {
	var time = 0.6;
	var steps = tps*5;
	gs.squares.forEach(function(x){
	    x.animateMoveTo(new THREE.Vector3(0, -300, 700), new THREE.Vector2(20,20),
			    x.mesh.rotation, time, true);});
    }

    function gameSquareAnimateLose()
    {
	gs.squares.forEach(function(x){
	    x.animateFade(3,true);
	});
    }


    function gameReset()
    {
	lost = false;
	init();
	animate();
    }

    function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.render(scene, camera);
    }

    function onMouseDown(e)
    {
	if (lost)
	{
	    gameReset();
	}
	else if (!active)
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
		if (!lost)
		    document.getElementById("paused").style.display = "block";
		pausedTime = Date.now();
		cancelAnimationFrame(animationFrameID);
	    }
    }; 
 
    
    init();
    animate();
}
