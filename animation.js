function Animation(func)
{
    this.done = false;
    this.func = func;
}

Animation.prototype.playStep = function()
{
    return this.done || this.func();
};

Animation.prototype.stop = function()
{
    this.done = true;
};
