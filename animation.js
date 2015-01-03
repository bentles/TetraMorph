function Animation(func)
{
    this.done = false;
    this.func = func;
}

Animation.prototype.play = function()
{
    return this.done || this.func();
};

Animation.prototype.stop = function()
{
    this.done = true;
};
