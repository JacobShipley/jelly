var game = new Phaser.Game(window.innerWidth, window.innerHeight, Phaser.CANVAS, 'jelly-background', { preload: preload, create: create, update: update, render: render });

/**
 * This program is heavily based on the work by Ian Snyder
 * and his game The Floor is Jelly (http://thefloorisjelly.com).
 * He was kind enough to share a snippet of the logic used for his physics calcuations
 * which is included below. 
 **/

var objects = [];

// Input
var MOUSE_RADIUS = 35;
var FORCE = 0.125;

// Colors
var COLORS = ["1abc9c","16a085","107360","0a463b","073028"];

// Misc
var OFFSET = 100;
var COUNT = 5;
var ROUNDED = true;
var dragging = false;

// Physics
var MAX_SPEED = 11;
var DECAY = .97;
var POWER = 1/60;
var ENTROPY = .15;
var DISTANCE = window.innerWidth / 15;


function preload() {
	game.stage.backgroundColor = COLORS[0];
}

function create() {
	objects = [];
	
	window.addEventListener('orientationchange', rotate);
	game.input.onDown.add(function(){ dragging = true }, this);
	game.input.onUp.add(function(){ dragging = false }, this);

	for(var i = 0; i < COUNT; i++){
		var cube = new JellyObject(-OFFSET, (i * window.innerHeight / COUNT), COLORS[i]);
		cube.points = generateRectangle(cube.x, cube.y, game.width + OFFSET, window.innerHeight / COUNT + 50);
		objects.push(cube);
	}
}

function JellyObject(x, y, color){
	this.points = [];
	this.x = x;
	this.y = y;
	this.color = color;
}

function generateRectangle(x, y, width, height){
	var p = [];
	var pt = {
		x: x,
		y: y,
		original_x: x,
		original_y: y,
		xs: 0,
		ys: 0
	}
	while (pt.x < x + width) {
		p.push(new Object());
		p[p.length-1].original_x = p[p.length-1].x = pt.x;
		p[p.length-1].original_y = p[p.length-1].y = pt.y;
		p[p.length-1].xs = pt.xs;
		p[p.length-1].ys = pt.ys;
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
	for(var i = 0; i < objects.length; i++){
		var jellyObject = objects[i];
		renderObject(jellyObject);
	}
}

function renderObject(jellyObject){
	game.context.fillStyle = jellyObject.color;
	game.context.strokeStyle = jellyObject.color;
    renderPoints(jellyObject.points);
}

function renderPoints(p){
	game.context.beginPath();
    game.context.moveTo(p[0].x, p[0].y);
    if(ROUNDED){
	    for(var i = 0, len=p.length; i < len; i++){
	    	var p0x = p[i+0 >= len ? i+0-len : i+0].x;
	    	var p0y = p[i+0 >= len ? i+0-len : i+0].y;
	    	var p1x = p[i+1 >= len ? i+1-len : i+1].x;
	    	var p1y = p[i+1 >= len ? i+1-len : i+1].y;
	    	game.context.quadraticCurveTo(p0x, p0y, (p0x+p1x) * 0.5, (p0y+p1y) * 0.5);
	    }
	} else{
		for(var i = 0; i < p.length; i++){
			var _p = p[i];
	    	game.context.lineTo(_p.x, _p.y);
	    }
	}
	game.context.stroke();
    game.context.fill();
    game.context.closePath();
}

function update(){
	for(var i = 0; i < objects.length; i++){
		var jellyObject = objects[i];
		applyPhysics(jellyObject);
	}

	if(dragging){
		influencePoints(game.input.x, game.input.y, MOUSE_RADIUS);
	}
}

function applyPhysics(jellyObject) {
	var points = jellyObject.points;
	var difference_x, difference_y, difference;
	
	for (var i = 0; i < points.length; i++) {
		// Dampening
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
			var dist = Math.sqrt(dx * dx + dy * dy);
			if (dist < RADIUS) {
			  p.xs -= dx * FORCE;
			  p.ys -= dy * FORCE;
			}
		}
	}
}

function rotate(){
	game.width = window.innerWidth;
	game.height = window.innerHeight;
	create();
}

window.onresize = function(event){
	create();
}