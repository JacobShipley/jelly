var game = new Phaser.Game(window.innerWidth, window.innerHeight, Phaser.CANVAS, 'jelly', { preload: preload, create: create, update: update, render: render });

/**
 * This program is heavily based on the work by Ian Snyder
 * and his game The Floor is Jelly (http://thefloorisjelly.com).
 * He was kind enough to share a snippet of the logic used for his physics calcuations
 * which is included below. 
 **/

var objects = [];
var dragging = false;

// Input
var MOUSE_RADIUS = 35;
var FORCE = 0.125;

// Colors
// I'm using a sea-green set of colors here
var COLORS = ["1abc9c","16a085","107360","0a463b","073028"];

// Misc
// This is the distance between points in the rectangle generation
var DISTANCE = window.innerWidth / 15;
// This is the horizontal offset of the objects 
var OFFSET = 100;
// This is how many rectangles to generate
var COUNT = 5;

// Physics
var MAX_SPEED = 11;
var DECAY = .97;
var POWER = 1/60;
var ENTROPY = .15;

function preload() {
	// Set background color
	game.stage.backgroundColor = COLORS[0];

	// Event listeners
	window.addEventListener('orientationchange', rotate);
	game.input.onDown.add(function(){ dragging = true }, this);
	game.input.onUp.add(function(){ dragging = false }, this);
}

function create() {
	// Empty the objects array every time since this function is called multiple times
	objects = [];

	// Create COUNT bars to fill the display
	for(var i = 0; i < COUNT; i++){
		// Create a new JellyObject that is slightly offset to the left, and slightly wider than the viewport
		// This eliminates seeing the edges of the objects jiggling about when you touch near the edges
		var cube = new JellyObject(-OFFSET, (i * window.innerHeight / COUNT), COLORS[i]);
		// Populate the points array by generating a rectangle
		cube.points = generateRectangle(cube.x, cube.y, game.width + OFFSET, window.innerHeight / COUNT + 50);
		objects.push(cube);
	}
}

function JellyObject(x, y, color){
	// Array of points, each with their own x,y pair and parameters for physics calculations
	this.points = [];
	// x,y position for the object.
	this.x = x;
	this.y = y;
	// Fill/Stroke color
	this.color = color;
}

function generateRectangle(x, y, width, height){
	// Create the points array
	var p = [];
	// Create the initial point at x,y
	var pt = {
		x: x,
		y: y,
		original_x: x,
		original_y: y,
		xs: 0,
		ys: 0
	}
	/* These four functions increment or decrement the side length by DISTANCE amount
	 * until it is the given width/height
	 */
	while (pt.x < x + width) {
		// Add a new point
		p.push(new Object());
		// Set the point's position and speed 
		p[p.length-1].original_x = p[p.length-1].x = pt.x;
		p[p.length-1].original_y = p[p.length-1].y = pt.y;
		p[p.length-1].xs = pt.xs;
		p[p.length-1].ys = pt.ys;
		// Increment the side length
		pt.x += DISTANCE;
	}
	while (pt.y < y + height) {
		p.push(new Object());
		p[p.length-1].original_x = p[p.length-1].x = pt.x;
		p[p.length-1].original_y = p[p.length-1].y = pt.y;
		p[p.length-1].xs = pt.xs;
		p[p.length-1].ys = pt.ys;
		pt.y += DISTANCE;
	}
	while (pt.x > x) {
		p.push(new Object());
		p[p.length-1].original_x = p[p.length-1].x = pt.x;
		p[p.length-1].original_y = p[p.length-1].y = pt.y;
		p[p.length-1].xs = pt.xs;
		p[p.length-1].ys = pt.ys;
		pt.x -= DISTANCE;
	}
	while (pt.y > y) {
		p.push(new Object());
		p[p.length-1].original_x = p[p.length-1].x = pt.x;
		p[p.length-1].original_y = p[p.length-1].y = pt.y;
		p[p.length-1].xs = pt.xs;
		p[p.length-1].ys = pt.ys;
		pt.y -= DISTANCE;
	}
	return p;
}

function render(){
	// Loop through the objects and render each one
	for(var i = 0; i < objects.length; i++){
		var jellyObject = objects[i];
		renderObject(jellyObject);
	}
}

function renderObject(jellyObject){
	// Set the colors from each object individually
	game.context.fillStyle = jellyObject.color;
	game.context.strokeStyle = jellyObject.color;
    renderPoints(jellyObject.points);
}

function renderPoints(p){
	game.context.beginPath();
    game.context.moveTo(p[0].x, p[0].y);
    for(var i = 0, len=p.length; i < len; i++){
    	var p0x = p[i >= len ? i-len : i].x;
    	var p0y = p[i >= len ? i-len : i].y;
    	var p1x = p[i+1 >= len ? i+1-len : i+1].x;
    	var p1y = p[i+1 >= len ? i+1-len : i+1].y;
    	// This is where the magic happens
    	// Canvas's quadridCurveTo function is a life saver here
    	game.context.quadraticCurveTo(p0x, p0y, (p0x+p1x) / 2, (p0y+p1y) / 2);
    }
	game.context.stroke();
    game.context.fill();
    game.context.closePath();
}

function update(){
	// Apply physics simulation
	for(var i = 0; i < objects.length; i++){
		var jellyObject = objects[i];
		applyPhysics(jellyObject);
	}

	// Apply our input
	if(dragging){
		influencePoints(game.input.x, game.input.y, MOUSE_RADIUS);
	}
}

function applyPhysics(jellyObject) {
	var points = jellyObject.points;
	var difference_x, difference_y, difference;
	
	for (var i = 0; i < points.length; i++) {
		// Dampen the speed 
		points[i].xs *= DECAY;
		points[i].ys *= DECAY;
		
		// Clamping
		if (points[i].xs > MAX_SPEED || points[i].xs < -MAX_SPEED) points[i].xs = MAX_SPEED*(points[i].xs<0 ? -1 : 1);
		
		// Slowly return to the original state
		points[i].xs -= (points[i].x - points[i].original_x)*POWER;
		points[i].ys -= (points[i].y - points[i].original_y)*POWER;
		
		// Apply the speed 
		points[i].x += points[i].xs;
		points[i].y += points[i].ys;
	}
	
	var j = points.length-1;
	for (var i = 0; i < points.length; i++) {
		difference_x = points[j].x-points[i].x;
		difference_y = points[j].y-points[i].y;
		if (Math.pow(difference_x,2)+Math.pow(difference_y, 2) > (Math.pow(MAX_SPEED, 4))) {
			difference = Math.sqrt(Math.pow(difference_x,2)+Math.pow(difference_y, 2));
			points[i].xs += ENTROPY*difference_x/difference;
			points[i].ys += ENTROPY*difference_y/difference;
			points[j].xs -= ENTROPY*difference_x/difference;
			points[j].ys -= ENTROPY*difference_y/difference;
		}
		j = i;
	}
}

function influencePoints(x, y, RADIUS){
	for(var i = 0; i < objects.length; i++){
		var points = objects[i].points;
		for(var j = 0; j < points.length; j++){
			var p = points[j];
			var dx = x - p.x;
			var dy = y - p.y;
			// Euclidian distance formula
			var dist = Math.sqrt(dx * dx + dy * dy);
			// If it's within our mouse influence radius, apply some force
			if (dist < RADIUS) {
			  p.xs -= dx * FORCE;
			  p.ys -= dy * FORCE;
			}
		}
	}
}

function rotate(){
	// Make sure the width/height are updated on rotation
	game.width = window.innerWidth;
	game.height = window.innerHeight;
	// Recreate the scene with the new width/height in mind
	create();
}

window.onresize = function(event){
	// Recreate the scene with the new window size in mind
	create();
}