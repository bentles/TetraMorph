
function GameSquare(material, difficulty, editable) //0 difficulty is just a single square
{
    this.difficulty = (difficulty === undefined) ? 10 : difficulty;
    this.editable = (editable === undefined) ? true : editable;
    this.material = material;
    this.squareString = "";
    this.numletters = 0;
    //make the parent of the top node the gamesquare
    this.squares = new Node(null, this); 
}

GameSquare.prototype.generateSquareString = function()
{
    //generates strings of the form "t" or "f" or "(tttt)" or "(tf(ttf(tfff))f)" which represent a gamesquare's squares
    //equality of two gamesquares is simply equality of their squareString
    
    this.numletters = 1;
    this.squareString = "f";
    
    for (var i = 0; i < this.difficulty; i++)
    {
	var operation = Math.random() >= 0.5;

	var pos = this.getSkewedRandomLetter();

	if (operation) //splitting a square	
	    this.splitAtNthLetter(pos);
	else //flipping a square
	    this.flipAtNthLetter(pos);
    }
};

GameSquare.prototype.getSkewedRandomLetter = function()
{
    var rand = Math.random(); //[0, 1)
    var depth = 0;
    var length = this.squareString.length;

    while(rand >= 0 && length--)
    {
	if (this.squareString[length] === ")")
	    depth++;
	else if (this.squareString[length] === "(")
	    depth--;
	else	    
	    rand -= 1/Math.pow(4,depth);
    }
    
    return length;
};

GameSquare.prototype.generateSquares = function()
{
    //takes the squareString and creates the actual meshes that represent the gamesquare
    //these are packaged into Square objects for easy manipulation
    //these in turn are placed in a quaternary-tree
    
    if (this.squareString === "")
	this.generateSquareString(); 
    //0 top left
    //1 top right
    //2 bot left
    //3 bot right

    var cornerlist = [0];

    //this is how deep we are in the tree
    var level = 0;

    //visits nodes and builds the squares tree (hopefully)
    var visitor = this.squares;

    //parse the string and create appropriately sized and spaced meshes
    for (var i = 0; i < this.squareString.length; i++)
    {
	switch (this.squareString[i]){
	case "(":
	    {
		visitor.addChildren(null, null, null, null);
		visitor = visitor.children[0];
		level++;
		cornerlist[level] = 0;
	    }
	    break;	    
	case ")":
	    {
		level--;
		cornerlist[level]++;
		cornerlist.pop();

		if (visitor.parent)
		    if (visitor.parent[cornerlist[level]])
			visitor = visitor.parent[cornerlist[level]];		
	    }
	    break;
	default:
	    {
		var newSquare = this.generatePositionedSquare(cornerlist, this.squareString[i] === "t");
		scene.add(newSquare.mesh);
		newSquare.gameSquare = this;
		visitor.value = newSquare;
		cornerlist[level]++;

		if (visitor.parent)
		    if (visitor.parent[cornerlist[level]])
			visitor = visitor.parent[cornerlist[level]];
	    }
	    break;
	}
    }
};

GameSquare.prototype.generatePositionedSquare = function(cornerlist, flipped)
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
    
    var mesh = new THREE.Mesh(geom, this.material);

    //could be right lol
    mesh.position.x = totalx;
    mesh.position.y = totaly;
    
    if (flipped)
	mesh.rotation.x = Math.PI;

    return new Square(mesh, flipped, this.editable);    
};

GameSquare.prototype.clearSquares = function()
{
    this.squares.forEach(function(square){scene.remove(square.mesh);});
    this.squares = new Node(null, this);
    this.squareString = "";
};

GameSquare.prototype.playerReset = function()
{
    this.clearSquares();
    this.squareString = "f";
    this.generateSquares();
    this.squares.value.mesh.position.x += -550;
};

GameSquare.prototype.getNthLetterDetails = function(n)
{
    var j = -1; //iterator
    var pos = -1; //position of letter to change
    while(j < n)
    {
	pos++;
	if (this.squareString[pos] !== "(" && this.squareString[pos] !== ")")
	    j++;
    }
    return {position:pos};
};

GameSquare.prototype.getSquareStringDetails = function()
{
    var t = 0;
    var f = 0;

    var len = this.squareString.length ;
    while(len--)
    {
	var chr = this.squareString[len];
	if (chr === "f")
	    f++;
	else if (chr === "t")
	    t++;
    }

    return {"t":t, "f":f};
};

/*Might not need these next two any more*/
GameSquare.prototype.splitAtNthLetter = function(n)
{
    this.squareString = this.squareString.substring(0, n) + "("
	+ this.squareString[n] + this.squareString[n] + this.squareString[n] + this.squareString[n] + ")"
	+ this.squareString.substring(n +1, this.squareString.length);
    this.numletters += 3;
};

GameSquare.prototype.flipAtNthLetter = function(n)
{
    this.squareString = this.squareString.substring(0, n) + (this.squareString[n]==="f"? "t" : "f")
	+ this.squareString.substring(n +1, this.squareString.length);    
};

GameSquare.prototype.updateSquareString = function()
{
    this.squareString = getSquareString(this.squares);
};

//recursion is fun :D
function getSquareString(node)
{
    if (node.hasValue())
	return node.value.flipped ? "t" : "f";
    else
    {
	var cn = node.children;
	return "(" + getSquareString(cn[0]) + getSquareString(cn[1]) + getSquareString(cn[2]) + getSquareString(cn[3]) + ")" ;
    }
}

GameSquare.prototype.forEachSquareMesh = function(func)
{
    this.squares.forEach(function(x) {
	func(x.mesh);
    });
};

GameSquare.prototype.getZ = function()
{
    return this.squares[0].mesh.position.z;
};



