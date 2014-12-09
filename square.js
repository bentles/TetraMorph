function Shape(mesh)
{
    this.mesh = mesh;
    mesh.shape = this;
}

function Square(mesh, flipped, editable)
{
    Shape.call(this, mesh);
    this.flipped = (flipped === undefined)? false: flipped;
    this.editable = (editable === undefined)? true: editable;
    this.node = null;
};
Square.prototype = Object.create(Shape.prototype);
Square.prototype.split = function(scene)
{
    if (this.editable)
    {
	var rmObject = this.mesh;
	var rmGeomParams = rmObject.geometry.parameters;
	var bigheight = (rmGeomParams.height + gap)/4;
	var height = (rmGeomParams.height - gap)/2;

	if (height > 5) //put a lower bound on how small these tiles get
	{
	    scene.remove(rmObject);
	    
	    var geom = new THREE.BoxGeometry(height,
					     height,
					     rmGeomParams.depth);

	    //add back material association to the geometry
	    for (var i = 0; i < 12; i++)
	    {
		geom.faces[i].materialIndex = materialmap[i];
	    }

	    //4 has to be about the most awkward number ever.
	    //I still can't decide if I should bother with arrays and loops or not

	    //create new meshes
	    var mesh0 = new THREE.Mesh(geom, this.mesh.material);
	    var mesh1 = new THREE.Mesh(geom, this.mesh.material);
	    var mesh2 = new THREE.Mesh(geom, this.mesh.material);
	    var mesh3 = new THREE.Mesh(geom, this.mesh.material);

	    //place them in the correct position
	    mesh0.position.addVectors(rmObject.position, new THREE.Vector3(-bigheight, bigheight, 0));
	    mesh1.position.addVectors(rmObject.position, new THREE.Vector3(bigheight, bigheight, 0));
	    mesh2.position.addVectors(rmObject.position, new THREE.Vector3(-bigheight, -bigheight, 0));
	    mesh3.position.addVectors(rmObject.position, new THREE.Vector3(bigheight,-bigheight, 0));

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
	    if (this.node != null)
	    {
		this.node.addChildren(square0, square1, square2, square3);
		this.node.getGameSquare().updateSquareString();
		console.log(this.node.getGameSquare().squareString);
	    }
	    
	    scene.add(square0.mesh, square1.mesh, square2.mesh, square3.mesh);
	}
    }
};
Square.prototype.flip = function(){
    if (this.editable)
    {
	this.flipped = !this.flipped;
	var animation= generateFlipAnimation(this, 15);
	animationlist.push(animation);
    }
};
Square.prototype.requestMerge = function(){
    if (this.editable)
    {
	var gs = this.node.getGameSquare();
	gs.addPositionedSquareAtNode(this.node.parent, this.flipped);
	gs.updateSquareString();
    }
};
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
	    if (square.node != null)
	    {
		square.node.getGameSquare().updateSquareString();
		console.log(square.node.getGameSquare().squareString);
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
