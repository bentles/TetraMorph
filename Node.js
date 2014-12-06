//lol Node.js
function Node(value, children, parent){
    this.value = (value === undefined)? null : value;
    this.parent = (parent === undefined)? null : parent;
    this.children = (children === undefined)? [] : children;

    //Only leaf nodes may have a value
    if (this.children.length !== 0)
	this.value = null;
}

//since this will be used to hold squares we'll always be adding four
Node.prototype.addChildren = function(a,b,c,d)
{
    //Only leaf nodes may have value
    this.value = null;
    this.children.push(a,b,c,d);
};

Node.prototype.hasValue = function()
{
    return value !== null;
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
	    this.children.forEach(
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



