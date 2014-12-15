
//these are out here for debug purposes
//all variables will be moved into main
var scene, camera, renderer, raycaster, projector, mouseVector;
var playermaterial, material, mesh, startpos, animationlist, materialmap, backdrop;
var animationFrameID;

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
	camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
	camera.position.z = 1000;
	
	projector = new THREE.Projector();
	mouseVector = new THREE.Vector3();

	//lighting
	var light = new THREE.PointLight( 0xffffff, 0.8 );
	light.position.set( 0.3, 0.2, 1 ).normalize();
	scene.add( light );
	
	//keep track of what's being rendered and animated
	animationlist = [];

	//work out shapes and materials
	var frontmaterial = new THREE.MeshBasicMaterial({color: 0x33CC33, shininess:50, vertexColors:THREE.FaceColors} );
	var sidematerial= new THREE.MeshBasicMaterial({color: 0x123123, shininess:50, vertexColors:THREE.FaceColors} );
	var backmaterial = new THREE.MeshBasicMaterial({color: 0x145214, shininess:50, vertexColors:THREE.FaceColors} );
	var materials = [frontmaterial, sidematerial, backmaterial];

	materialmap = [1,1,1,1,1,1,1,1,0,0,2,2];
	
	playermaterial = new THREE.MeshFaceMaterial(materials);
	material = new THREE.MeshFaceMaterial(materials);

	//create the backdrop
	initBackDrop();
	
	//player
	playerGameSquare = new GameSquare(playermaterial, 0);
	playerGameSquare.generateSquares();
	playerGameSquare.addX(-550);	

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
	//don't do physics at all if not enough time has passed
	//since last render. instead, render again
	while (accumulator >= dt) 
	{
	    gameLogic();

	    accumulator -= dt;
	}

	//TODO add interpolation somehow
	renderer.render( scene, camera );	
    }

    var tscore = new Score(0, "t", false, 0x145214);
    var fscore = new Score(0, "f", true,  0x33CC33);
    var timeForShape = 10; //seconds
    var countDownToNextShape = 0;
    var startpos = -3000;
    var difficulty = 3;
    function gameLogic()
    {
	//make new shapes that fly towards the screen every few seconds
	if (countDownToNextShape > 0)
	{
	    countDownToNextShape--;
	}
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

	//Execute animations
	//==================
	//animationlist is a list of functions that return true if complete
	//call each function in turn and remove those that return true
	//this may or may not be a terrible way to do this that I regret later lol
	var len = animationlist.length;
	    while(len--)
	    {
		var done = animationlist[len]();
		if (done)
		{
		    animationlist.splice(len,1);		
		}
	    }
    }

    function gameSquareMoveAniGen(playergs, gs)
    {
	return function(){
	    if (gs.getZ() < playergs.getZ())
	    {
		var step = Math.abs(playergs.getZ() - startpos)/(timeForShape*tps);
		gs.addZ(step);

		//if they win before the end move on to the next animation
		if (playergs.squareString === gs.squareString)
		{		    
		    animationlist.push(gameSquareCompleteAniGen(playergs, gs));
		    return true;
		}
		
		return false;
	    }
	    else
	    {
		animationlist.push(gameSquareCompleteAniGen(playergs, gs));
		return true;
	    }
	};
    }

    function gameSquareCompleteAniGen(playergs, gs)
    {
	var steps = tps*5;
	var won = (playergs.squareString === gs.squareString);
	var scores = playergs.getSquareStringDetails();

	//get the next shape going and increase score
	countDownToNextShape = 0;
	playergs.playerReset();
	if (won)
	{
	    difficulty += 0.1;
	    tscore.add(scores.t);
	    fscore.add(scores.f);
	}
	
	return function(){
	    if (steps > 0)
		{
		    gs.forEachSquareMesh(
			function(mesh)
			{
			    //TODO: fancy stuff if they win or lose
			    mesh.position.x += 10;
			    mesh.rotation.x += 0.2;
			});
		    steps--;
		    return false;
		}
	    else
		{
		    gs.clearSquares();
		    return true;
		}
	};
    }

    function getRGB(colorHex)
    {
	var r = colorHex / 0x10000 | 0;
	var g = (colorHex % 0x10000) / 0x100 | 0;
	var b = colorHex % 0x100;

	return {"r":r, "g":g, "b":b};
    }

    //programatically create a pixelated striped texture
    //because downloading stuff is slow
    function generateStripedTexture(color1, color2, width)
    {
	//length:width = 16:1 
	//we shall use a 512x32 texture
	var texsize = 512*32;
	var texture = new Uint8Array(texsize*4);
	var col1 = getRGB(color1);
	var col2 = getRGB(color2);
	var colorwidth = width;
	var linewidth = 128;
	//each end of a closed interval of color
	var lhs = -4;
	var rhs = colorwidth - 4 - 1;
	
	for (var i = 0; i < texsize * 4; i+= 4)
	{
	    if (i % (linewidth))
	    {
		lhs += 4; rhs += 4;
		lhs %= linewidth; rhs %= linewidth;
	    }
	    if (lhs > rhs) //we check two regions
	    {
		if ((i >= 0 && i <= rhs)|| (i >= lhs && i <= (linewidth - 1)))
		    addColorUints(col1, 128, texture, i);
		else
		    addColorUints(col2, 128, texture, i);
	    }
	    else if (i >= lhs && i <= rhs)
		addColorUints(col1, 128, texture, i);
	    else
		addColorUints(col2, 128, texture, i);	    
	}
    }

    function addColorUints(color, alpha, array, i)
    {
	array[i] = color.r;
	array[i+1] = color.g;
	array[i+2] = color.b;
	array[i+3] = alpha;
    }

    function initBackDrop()
    {
	var geom = new THREE.BoxGeometry(2100, 1000, 16000);
	backdrop = new THREE.MeshPhongMaterial({color: 0x33CC33, shininess:70, vertexColors:THREE.FaceColors} );
	var mesh = new THREE.Mesh(geom, backdrop);
	mesh.material.side = THREE.BackSide ;
	scene.add(mesh);
    }

    function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	
	renderer.setSize( window.innerWidth, window.innerHeight );
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
	    tscore.toggleMultiplier();
	    fscore.toggleMultiplier();
	}
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



