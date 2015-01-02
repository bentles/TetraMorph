function Score(count, id, multiplier, color, colourableids, bar)
{
    this.id = id;
    this.count = count;
    this.multiplier = multiplier;
    this.color = color;

    this.small = "20pt";
    this.large = "30pt";
    this.barDomElement = document.getElementById(bar);
    this.domElement = document.getElementById(this.id);
    this.domElement.style.fontSize = this.multiplier? this.large: this.small;

    this.colourables = [];
    for (var i = 0; i < colourableids.length; i ++)
    {
	this.colourables.push(document.getElementById(colourableids[i]));
	this.colourables[i].style.fill = "#" + this.color.toString(16);
    }

}

Score.prototype.toggleMultiplier = function()
{
    this.multiplier = !this.multiplier;
    this.domElement.style.fontSize = this.multiplier? this.large: this.small;
};

Score.prototype.add = function(x)
{
    var that = this;
    this.count += this.multiplier? 2*x : x ;
    this.domElement.innerHTML = this.count;
    var time = 0.5; //time for the animation is half a sec
    var target = (Math.log(this.count)/Math.log(10))*100 || 0;
    target = target < 0 ? 0 : target;
    var current = parseInt(this.barDomElement.getAttribute("width"));
    var step = (target - current)/(time*tps) ;
    var count = 0;
    animationlist.push(function(){
	count++;
	if (count <= (time*tps))
	{
	    //look into changing this if possible for two to play at once.
	    that.barDomElement.setAttribute("width", current + step*count);
	    return false;
	}
	else
	    return true;
	
    });    
};

Score.prototype.lost = function()
{
    return this.count < 0;
};
