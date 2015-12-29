var Config = require("./config.js");
var Animation = require("./animation.js");
var GameState = require("./gamestate.js");

function Score(id, multiplier, color, colourableids, bar) {
    this.id = id;
    this.count = 0;
    this.multiplier = multiplier;
    this.color = color;

    this.small = Config.smallfont;
    this.large = Config.largefont;
    this.barDomElement = document.getElementById(bar);
    this.domElement = document.getElementById(this.id);
    this.domElement.style.fontSize = this.multiplier ? this.large : this.small;

    this.colourables = [];
    for (var i = 0; i < colourableids.length; i++) {
        this.colourables.push(document.getElementById(colourableids[i]));
        this.colourables[i].style.fill = "#" + this.color.toString(16);
    }
}

Score.prototype.toggleMultiplier = function() {
    this.multiplier = !this.multiplier;
    this.domElement.style.fontSize = this.multiplier ? this.large : this.small;
};

Score.prototype.add = function(x) {
    var that = this;
    this.count += x;
    this.count = this.count < 0 ? 0 : this.count;
    this.domElement.innerHTML = this.count;

    //animate tongue
    var time = Config.score_animation_time; //time for the animation is half a sec
    var target = (Math.log(this.count) / Math.log(10)) * 100 || 0;
    target = target < 0 ? 0 : target;
    var current = parseInt(this.barDomElement.getAttribute("width"));
    var step = (target - current) / (time * Config.tps);
    var count = 0;
    GameState.animationlist.push(new Animation(function() {
        count++;
        if (count <= (time * Config.tps)) {
            //look into changing this if possible for two to play at once.
            that.barDomElement.setAttribute("width", current + step * count + "px");
            return false;
        } else
            return true;

    }));
};

Score.prototype.lost = function() {
    return this.count < 0;
};

module.exports = Score;
