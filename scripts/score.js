var Config = require("./config.js");
var Animation = require("./animation.js");
var GameState = require("./gamestate.js");

function Score(id, color, text) {
    this.text = text === undefined ? "" : text;
    this.id = id;
    this.count = 0;
    this.color = color;
    this.domElement = document.getElementById(this.id);
}

Score.prototype.add = function(x) {
    this.count += x;
    this.count = this.count < 0 ? 0 : this.count;
    this.domElement.innerHTML = this.text + this.count;
};

Score.prototype.reset = function() {
    this.count = 0;
    this.domElement.innerHTML = this.text + this.count ;
}

Score.prototype.lost = function() {
    return this.count < 0;
};

module.exports = Score;
