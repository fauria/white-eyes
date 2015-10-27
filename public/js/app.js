$(document).ready(function(){
	var socket = io.connect();
	var canvas = $('#canvas-video').get(0);
	
	var context = canvas.getContext('2d');
	var img = new Image();

	// show loading notice
	context.fillStyle = '#ffffff';
	context.fillText('Let me see...', canvas.width/2, canvas.height/3);

	$('#say').click(function(){								
		socket.emit('say', $('#how-many-people').html());
	});

	socket.on('clear-faces', function(){
		$.each($("div.face"), function(){			
			$(this).empty();
		});	
	});
	
	socket.on('face-pic', function (data) {	
		console.log(data);
		var slot = $("#face-"+data.pos);

		var uint8Arr = new Uint8Array(data.buffer);
		var str = String.fromCharCode.apply(null, uint8Arr);	
		var base64String = btoa(str);

		slot.append('<img src="" alt="face">');
		slot.append('<p>');				
		slot.children(0).html(new Date());
		slot.children(1).attr('src', 'data:image/png;base64,' + base64String);
	});
	

	socket.on('frame', function (data) {
		// Reference: http://stackoverflow.com/questions/24107378/socket-io-began-to-support-binary-stream-from-1-0-is-there-a-complete-example-e/24124966#24124966
		var uint8Arr = new Uint8Array(data.buffer);
		var str = String.fromCharCode.apply(null, uint8Arr);
		var base64String = btoa(str);

		img.onload = function () {
		context.drawImage(this, 0, 0, canvas.width, canvas.height);
		};

		img.src = 'data:image/png;base64,' + base64String;
	});

	socket.on('people-i-see', function (data) {
		$('#how-many-people').html(data);
	});
});

