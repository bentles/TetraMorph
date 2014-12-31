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
    this.count += this.multiplier? 2*x : x ;
    this.domElement.innerHTML = this.count;
    this.barDomElement.setAttribute("width",(Math.log(this.count)/Math.log(10))*100 || 0);
};
