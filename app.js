'use strict';

var exec = require('child_process').exec;
var express = require('express');
var cv = require('opencv');
var ejs = require('ejs');

var app = express();
var people = 0;

// Setup Express and routes:
app.engine('html', ejs.renderFile);
app.set('view engine', 'ejs');

app.use(express.static('bower_components'));
app.use(express.static('public'));

app.get('/', function(req, res){
	res.render('index.html');
});

app.get('/say', function(req, res){
	console.log('Remote request!');
	process.emit('remote-say', people);
	res.end(String(people));
});

// Initialize CV environment: 
	
var camWidth = 320;
var camHeight = 240;
var camFps = 10;
var camInterval = 1000 / camFps;

var rectColor = [0, 255, 0];
var rectThickness = 2;

// Found faces
var currentFaces = []; 

// Initialize camera:
var camera = new cv.VideoCapture(0);
camera.setWidth(camWidth);
camera.setHeight(camHeight);	

// Based on https://github.com/drejkim/face-detection-node-opencv
function faceDetection(socket){
	console.log('Face detection engine started.');

	var say = function(people) {		
		socket.emit('clear-faces');
		currentFaces.forEach(function(face, pos){
			socket.emit('face-pic', {buffer: face.toBuffer(), pos: pos});
		});		

		// Text-to-speech:
		switch(Number(people)) { 
			case 0:
				exec('say ". I do not see anyone."');
				break;
			case 1:
				exec('say ". I see one person."');
				break;
			default:
				exec('say ". I see '+people+' people."');
				break;
		}	
	};
	
	// Event listeners:
	process.on('frame', function(buffer){
		socket.emit('frame', buffer);
	});

	process.on('people-i-see', function(people){
		socket.emit('people-i-see', people);
	});
	
	process.on('remote-say', function(people){
		say(people);		
	});

	socket.on('say', say);		
}	

// Start server
var server = app.listen(3000, function(){

	// Initialize socket.io
	var io = require('socket.io')(server);
	io.sockets.setMaxListeners(1);
	io.on('connection', faceDetection);	

	// Real time, should be on-demand:
  	setInterval(function() {
		camera.read(function(err, im) {																
	    	if (!err) {
	    		// Stock Haar classifier cascade
				im.detectObject('./node_modules/opencv/data/haarcascade_frontalface_alt2.xml', {}, function(err, faces) {
					if (!err) {
						// How many people are there and who they are:
						people = faces.length;
				    	currentFaces = [];

				    	// Draw green rectangle and crop:
				        for (var i = 0; i < people; i+=1) {
				        	var face = faces[i];   
				        	currentFaces.push(im.copy().roi(face.x, face.y, face.width, face.height));
				        	im.rectangle([face.x, face.y], [face.width, face.height], rectColor, rectThickness);
				        }		        

				        // Trigger event to be emitted:
				        process.emit('frame', { buffer: im.toBuffer() });  
				        process.emit('people-i-see', people); 
					}			    	    	      
				});
	    	}			   
	    });
	}, camInterval);

	console.log('Server listening on port %s', server.address().port);
});