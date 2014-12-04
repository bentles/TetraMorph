
function GameSquare(material, difficulty, editable) //0 difficulty is just a single square
{
    this.difficulty = (difficulty === undefined) ? 10 : difficulty;
    this.editable = (editable === undefined) ? true : editable;
    this.material = material;
    this.squareString = "";
    this.numletters = 0;
    this.squares = [];
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
	var letter = Math.floor(Math.random() * this.numletters);

	var pos = this.getNthLetterDetails(letter).position;

	if (operation) //splitting a square	
	    this.splitAtNthLetter(pos);
	else //flipping a square
	    this.flipAtNthLetter(pos);
    }
};

GameSquare.prototype.generateSquares = function()
{
    //takes the squareString and creates the actual meshes that represent the gamesquare
    //these are packaged into Square objects for easy manipulation
    
    if (this.squareString === "")
	this.generateSquareString(); 
    //0 top left
    //1 top right
    //2 bot left
    //3 bot right

    var cornerlist = [0];

    //this is how deep we are in the tree
    var level = 0;

    //parse the string and create appropriately sized and spaced meshes
    for (var i = 0; i < this.squareString.length; i++)
    {
	switch (this.squareString[i]){
	case "(":
	    {
		level++;
		cornerlist[level] = 0;
	    }
	    break;	    
	case ")":
	    {
		level--;
		cornerlist[level]++;
		cornerlist.pop();
	    }
	    break;
	default:
	    {
		var newSquare = this.generatePositionedSquare(cornerlist, this.squareString[i] === "t");
		scene.add(newSquare.mesh);
		newSquare.gameSquare = this;
		this.squares.push(newSquare);
		cornerlist[level]++;		
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

GameSquare.prototype.forEachSquareMesh = function(func)
{
    this.squares.forEach(function(x) {
	func(x.mesh);
    });
};



