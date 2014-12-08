function Score(count, id, multiplier, color)
{
    this.id = "#" + id;
    this.count = count;
    this.multiplier = multiplier;
    this.color = color;

    this.small = "20pt";
    this.large = "30pt";
    this.domElement = $(this.id);
    this.domElement.css("font-size", this.multiplier? this.large: this.small);
}

Score.prototype.toggleMultiplier = function()
{
    this.multiplier = !this.multiplier;
    this.domElement.css("font-size", this.multiplier? this.large: this.small);
    if (this.multiplier)
	backdrop.color.setHex(this.color);
};

Score.prototype.add = function(x)
{
    this.count += this.multiplier? 2*x : x ;
    this.domElement.text(this.count);
};
