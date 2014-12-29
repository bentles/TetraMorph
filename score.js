function Score(count, id, multiplier, color)
{
    this.id = id;
    this.count = count;
    this.multiplier = multiplier;
    this.color = color;

    this.small = "20pt";
    this.large = "30pt";
    this.domElement = document.getElementById(this.id);
    this.domElement.style.fontSize = this.multiplier? this.large: this.small;
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
};
