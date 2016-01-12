TetraMorph
==========
A WIP game based on my Squares.js repo, also first use of browserify :)

You can try it out here: http://bentles.github.io/TetraMorph

Controls
----------
- left click to split a square
- right click to flip a square
- middle click to merge squares (also shift + left click)
- esc to pause

How the game works
-----------
The game will constantly generate patterns of squares of increasing complexity. Your job is to recreate the pattern before your time runs out. You do so using three operations. You may split any square into 4 smaller ones. You may merge 4 small sqaures into a large square, and you may flip over a square to change its colour.

How to win
----------
Unfortunately you're out of luck here. You cannot win this game. Your aim is to survive. Game over occurs when you fail to recreate a square before it is in line with the square you are manipulating.
