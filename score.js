function Score(count, id)
{
    this.id = id;
    this.count = count;
}

Score.prototype.add = function(x)
{
    this.count += x;
    this.updateDOM();
};

Score.prototype.updateDOM = function()
{
    $("#"+this.id).text(this.count);
};
