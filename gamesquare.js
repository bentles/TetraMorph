
function GameSquare(difficulty, editable) //0 difficulty is just a single square
{
    this.difficulty = (difficulty === undefined) ? 10 : difficulty;
    this.editable = (editable === undefined) ? true : editable;
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
GameSquare.prototype.generateSquares = function()
{
    //takes the squareString and creates the actual meshes that represent the gamesquare
    //these are packaged into Square objects for easy manipulation
    
    if (this.squareString === "")
	this.generateSquareString(); 
    //0 top left,
    //1 top right,
    //2 bot left,
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
		var newSquare = generatePositionedSquare(cornerlist, this.squareString[i] === "t");
		newSquare.gameSquare = this;
		this.squares.push(newSquare);
		cornerlist[level]++;		
	    }
	    break;
	}
    }
};


