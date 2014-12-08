//lol Node.js
function Node(value, parent, children){
    this.value = (value === undefined)? null : value;
    this.parent = (parent === undefined)? null : parent;
    this.children = (children === undefined)? [] : children;

    //Only leaf nodes may have a value
    if (this.children.length !== 0)
	this.value = null;
}

//since this will be used to hold squares we'll always be adding four
Node.prototype.addChildren = function(sqra,sqrb,sqrc,sqrd)
{
    //Only leaf nodes may have value
    this.value = null;
    var a = new Node(sqra,this);
    var b = new Node(sqrb,this);
    var c = new Node(sqrc,this);
    var d = new Node(sqrd,this);
    sqra.node = a;
    sqrb.node = b;
    sqrc.node = c;
    sqrd.node = d;
    this.children = [];
    this.children.push(a,b,c,d);
};

Node.prototype.initChildren = function()
{
    this.children = [];
    for (var i = 0; i < 4; i++)
    {
	var a = new Node(null, this);
	this.children.push(a);
    }
};

Node.prototype.hasValue = function()
{
    return this.value !== null;
};

Node.prototype.forEach = function(fn)
{
    if (this.hasValue())
	fn(this.value);
    else
    	this.children.forEach(function(child){child.forEach(fn);});
};

Node.prototype.getGameSquare = function()
{
    return (this.parent instanceof GameSquare)? this.parent : this.parent.getGameSquare(); 
};

Node.prototype.setValue = function(square)
{
    this.value = square;
    square.node = this;
    scene.add(square.mesh);

    //this just looks cool
    this.children.forEach(
	function (child){child.forEach(
	    function(square){scene.remove(square.mesh);});	
    });
    
    this.children = [];
};

//A function to discover which squares have been missed by the player
//It populates two lists: one for flipped(tlist) and one for unflipped(flist) squares
//----------------------------------------------------------------------
//There are 3 cases to add to either list:
//case I: different value
//case II: playernode has more children than it should
//case III: playernode is missing children that it should have
function doubleTreeRecursion(playernode, gamenode, tlist, flist)
{
    if (gamenode.hasValue())
    {
	if (playernode.hasValue())
	{
	    if (playernode.value.flipped !== gamenode.value.flipped) //case I
	    	addToList(gamenode.value, tlist, flist);
	}
	else //case II: i.e. playernode has children
	{
	    addToList(gamenode.value, tlist, flist);
	}
    }
    else //gamenode has children
    {
	if (playernode.hasValue()) //case III - recurse through all the missing children and add them using sTR	
	    gamenode.children.forEach(
		function(x){singleTreeRecursion(x, tlist, flist);});	
	else
	{
	    for (var i = 0; i < 4; i++)	    
		doubleTreeRecursion(playernode.children[i], gamenode.children[i], tlist, flist);	    
	}
    }
}

function addToList(value, tlist, flist)
{
    if (value.flipped)
	tlist.push(value);
    else
	flist.push(value);    
}

function singleTreeRecursion(node, tlist, flist)
{
    if (node.hasValue())
    	addToList(node.value, tlist, flist);
    else
	node.children.forEach(
	    function(x) {
		singleTreeRecursion(x, tlist, flist);
	    });    
}



