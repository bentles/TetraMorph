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

Square.prototype.requestSplit = function()
{
    if (this.editable)
    {
	var gs = this.node.getGameSquare();
	this.node.initChildren();
	for (var i = 0; i < 4; i++)
	    gs.addPositionedSquareAtNode(this.node.children[i], this.flipped);
	gs.updateSquareString();
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
