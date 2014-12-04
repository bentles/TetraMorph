
//these are out here for debug purposes
var scene, camera, controls, renderer, raycaster, projector, mouseVector;
var playermaterial, material, mesh, startpos, animationlist, materialmap;
var animationFrameID;

//debug vars
var squaregame;

//player's GameSquare
var playerGameSquare
;
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

	//controls
        controls = new THREE.OrbitControls(camera);
	initControls(controls);
	
	//keep track of what's being rendered and animated
	animationlist = [];

	//work out shapes and materials
	var frontmaterial = new THREE.MeshBasicMaterial({color: 0x33CC33, shininess:70, vertexColors:THREE.FaceColors} );
	var sidematerial= new THREE.MeshBasicMaterial({color: 0xffffff, shininess:70, vertexColors:THREE.FaceColors} );
	var backmaterial = new THREE.MeshBasicMaterial({color: 0x145214, shininess:70, vertexColors:THREE.FaceColors} );
	var materials = [frontmaterial, sidematerial, backmaterial];

	materialmap = [1,1,1,1,1,1,1,1,0,0,2,2];
	
	playermaterial = new THREE.MeshFaceMaterial(materials);
	material = new THREE.MeshFaceMaterial(materials);

	//create the backdrop
	initBackDrop();
	
	//player
	playerGameSquare = new GameSquare(playermaterial, 0);
	playerGameSquare.generateSquares();
	playerGameSquare.squares.forEach(function (x){
	    x.mesh.position.x -= 550;});	

	//set up renderer
	renderer = new THREE.WebGLRenderer({antialias:true});
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.setClearColor( 0x242424 );
	document.body.appendChild( renderer.domElement );

	//add event listeners for mouse
	document.addEventListener( 'mousedown', onMouseDown, false);
	document.addEventListener( 'mouseup', onMouseUp, false);
	window.addEventListener('resize', onWindowResize, false);
	window.addEventListener('keydown', onKeyBoard, false);
	window.addEventListener('blur', onBlur, false);
	window.addEventListener('focus', onFocus, false);
	
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


    var timeForShape = 10; //seconds
    var countUpToNextShape = timeForShape*tps;
    var startpos = -3000;
    var gamesquares = [];
    function gameLogic()
    {
	//make new shapes that fly towards the screen every few seconds
	if (countUpToNextShape < timeForShape*tps)
	{
	    countUpToNextShape++;
	}
	else if(countUpToNextShape === timeForShape*tps)
	{
	    var gs = new GameSquare(material, 10, false); //make an uneditable gamesquare
	    gamesquares.push(gs);
	    
	    gs.generateSquares();
	    gs.forEachSquareMesh(function (x){
		x.position.x += 550;
		x.position.z = startpos;
	    });
	    
	    countUpToNextShape = 0;		
	}	

	//Execute animations
	//==================
	//animationlist is a list of functions that return true if complete
	//call each function in turn and remove those that return true
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

    function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	
	renderer.setSize( window.innerWidth, window.innerHeight );
    }

    function onMouseDown(e)
    {
	//bring back focus if paused by esc key
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

	    if (intersects[0] && (intersects[0].object.shape != undefined))
	    {
		//it's annoying when move the shape when you are simply trying to click
		//so I simply disable that ability when you click on a square <3
		controls.noRotate = true;
		
		if (e.button === 0)
		{
		    intersects[0].object.shape.split(scene);		    
		}
		
		else if (e.button === 2)
		{
		    intersects[0].object.shape.flip();
		}
	    }
	}
    }

    function onMouseUp(e)
    {
	controls.noRotate = false;	
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
    }

    function initControls(controls){
	controls.damping = 0.2;
	controls.minPolarAngle = Math.PI/2;
	controls.maxPolarAngle = Math.PI/2;	
	controls.minAzimuthAngle = -Math.PI/2;
	controls.maxAzimuthAngle = Math.PI/2;
	controls.noPan = true;
    }

    function initBackDrop()
    {
	var geom = new THREE.BoxGeometry(2100, 1000, 10000);
	var material = new THREE.MeshLambertMaterial({color: 0xCCCCCC, shininess:70, vertexColors:THREE.FaceColors} );
	var mesh = new THREE.Mesh(geom, material);
	mesh.material.side = THREE.BackSide ;
	scene.add(mesh);
    }

    function onFocus()
    {
	if (!active) //needed on firefox
	    {
		active = true;
		pausedTime = Date.now() - pausedTime;
		requestAnimationFrame(animate);
	    }
    };

    function onBlur()
    {
	if (active) //just to be safe
	    {
		active = false;
		//TODO put something on the screen that says "click to focus"
		pausedTime = Date.now();
		cancelAnimationFrame(animationFrameID);
	    }
    };    
        
    init();
    animate();
}



