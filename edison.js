'use strict';

var request = require('request');
var mraa = require('mraa');
var LCD  = require ('jsupm_i2clcd');
var Buzzer = require("jsupm_buzzer");

// Create and initialize pushbutton, buzzer and LCD Grove modules:
var button = new mraa.Gpio(4);
var buzzer = new Buzzer.Buzzer(3);
var lcd = new LCD.Jhd1313m1(6, 0x3E, 0x62);

button.dir(mraa.DIR_IN);
buzzer.stopSound();	
lcd.setCursor(0,1);
lcd.write('Loading');
lcd.setCursor(1,1);
lcd.write('White Eyes...');

// Listen to pushbutton clicks:
var clicked = 0;

setInterval(function(){
	var status = button.read();

	// Can be continously pushed:
	if(status && !clicked){
		clicked = status;	    	    
		// Tiny beep
	    buzzer.playSound(Buzzer.RE, 10000);
	    buzzer.stopSound();		    

	    // Hardcode Node.js server URL:
	    request('http://192.168.44.80:3000/say', {timeout: 1500}, function (err, res, body) {
		  if ( !err && res.statusCode === 200) {		  	
		    process.emit('i-see-alive-people', body);
		  }else{		
		  	lcd.clear();  	
		  	lcd.write('I see nobody...');
		  	process.emit('now-i-see');
		  }
		});	    
	}			
}, 100);

// Release pushbutton lock:
process.on('now-i-see', function(){
	clicked = 0;
});


// Process capture event
process.on('i-see-alive-people', function(people){		
	lcd.clear();
	
	switch(Number(people)) { 
		case 0:
			lcd.write('I see nobody...');
			break;
		case 1:
			lcd.write('I see 1 person.');
			break;
		default:
			lcd.write('I see '+people+' people.');
			break;
	}
	
	// Wait for text-to-speech before unlocking the pushbutton:
	setTimeout(function(){
		process.emit('now-i-see');
	}, 1500);	
});
