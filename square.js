var c;

function Shape(mesh)
{
    this.mesh = mesh;
    mesh.shape = this;
}

function Square(mesh, flipped)
{
    Shape.call(this, mesh);
    this.flipped = flipped || false;
    this.gameSquare = null;
};
Square.prototype = Object.create(Shape.prototype);
Square.prototype.split = function(renderlist)
{
    var rmObject = this.mesh;
    var rmGeomParams = rmObject.geometry.parameters;
    var bigheight = (rmGeomParams.height + gap)/4;
    var height = (rmGeomParams.height - gap)/2;

    if (height > 5) //put a lower bound on how small these tiles get
    {
	renderlist.remove(rmObject.shape);
	
	var geom = new THREE.BoxGeometry(height,
					 height,
					 rmGeomParams.depth);

	//add back material association to the geometry
	for (var i = 0; i < 12; i++)
	{
	    geom.faces[i].materialIndex = materialmap[i];
	}

	//4 has to be about the most awkward number ever.
	//I can't decide if I should bother with arrays and loops or not

	//lol this is gonna need refactoring
	
	//create new meshes
	var mesh0 = new THREE.Mesh(geom, material);
	var mesh1 = new THREE.Mesh(geom, material);
	var mesh2 = new THREE.Mesh(geom, material);
	var mesh3 = new THREE.Mesh(geom, material);

	//place them in the correct position
	mesh0.position.addVectors(rmObject.position,
				  new THREE.Vector3(-bigheight, bigheight, 0));
	mesh1.position.addVectors(rmObject.position,
				  new THREE.Vector3(bigheight, bigheight, 0));
	mesh2.position.addVectors(rmObject.position,
				  new THREE.Vector3(-bigheight, -bigheight, 0));
	mesh3.position.addVectors(rmObject.position,
				  new THREE.Vector3(bigheight,-bigheight, 0));


	//orient them accordingly
	if (this.flipped)
	{
	    mesh0.rotation.x = Math.PI;
	    mesh1.rotation.x = Math.PI;
	    mesh2.rotation.x = Math.PI;
	    mesh3.rotation.x = Math.PI;
	}

	//create squares
	var square0 = new Square(mesh0, this.flipped);
	var square1 = new Square(mesh1, this.flipped);
	var square2 = new Square(mesh2, this.flipped);
	var square3 = new Square(mesh3, this.flipped);

	//edit the parent squares list and squareString as needed
	if (this.gameSquare != null)
	{	    
	    var squarepos = this.gameSquare.squares.indexOf(this);
	    var letterpos = this.gameSquare.getNthLetterDetails(squarepos).position;
	    
	    square0.gameSquare = this.gameSquare;
	    square1.gameSquare = this.gameSquare;
	    square2.gameSquare = this.gameSquare;
	    square3.gameSquare = this.gameSquare;

	    this.gameSquare.splitAtNthLetter(letterpos);
	    this.gameSquare.squares.splice(squarepos, 1, square0, square1, square2, square3);

	    console.log(this.gameSquare.squareString);
	}
	    
	renderlist.add(square0, square1, square2, square3);	    
    }
};
Square.prototype.flip = function(){
    var animation= generateFlipAnimation(this, 15);
    animationlist.push(animation);
};

function generatePositionedSquare(cornerlist, flipped)
{
    var totalx = 0;
    var totaly = 0;

    //helper variable for calculating position
    var height = 1000;

    //size of the square dimension x dimesion
    var dimension = 1000;
    
    for (var i = 1 ; i < cornerlist.length; i++)
    {
	var x = (cornerlist[i] % 2);
	x = x === 0? -1 : x;
	var y = cornerlist[i] < 2 ? 1 : -1;

	var change = height/4 + gap/4;
	height = (height - gap)/2;
	
	totalx += x*change;
	totaly += y*change;
    }

    i--; //i must be one too large for the loop to end

    dimension = dimension/Math.pow(2, i) - geometricSeriesSum(gap/2, 1/2, i); //probably wrong

    var geom = new THREE.BoxGeometry(height, height, depth);

    for (var j = 0; j < 12; j++)
    {
	geom.faces[j].materialIndex = materialmap[j];
    }
    
    var mesh = new THREE.Mesh(geom, material);

    //could be right lol
    mesh.position.x = totalx;
    mesh.position.y = totaly;
    
    if (flipped)
	mesh.rotation.x = Math.PI;

    return new Square(mesh,flipped);
    
}

function generateFlipAnimation(square, pifractions)
{
    var mesh = square.mesh;
    var step = (1/pifractions)*Math.PI;
    var count = 0;

    //LEXICAL CLOSURES HAAA!!!! (Imagine DBZ voice acting)
    return function()
    {
	if (count < pifractions)
	{
	    mesh.rotation.x += step ;
	    count++;

	    if (mesh.rotation.x >= Math.PI*2)
 		mesh.rotation.x = mesh.rotation.x - Math.PI*2;
	    return false;
	}
	else
	{
	    square.flipped = !square.flipped;

	    if (square.gameSquare != null)
	    {
		var squarepos = square.gameSquare.squares.indexOf(square);
		var letterpos = square.gameSquare.getNthLetterDetails(squarepos).position;
		square.gameSquare.flipAtNthLetter(letterpos);
		console.log(square.gameSquare.squareString);
	    }
	    
	    return true;
	}
    };
}

//a is start
//r is the multiplication factor
//n is the term number
function geometricSeriesSum(a,r,n)
{
    return a*((1-Math.pow(r,n))/(1-r));
}
