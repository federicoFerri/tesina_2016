var express = require('express'); 
var app = express();  
var server = require('http').createServer(app);  
var io = require('socket.io')(server);

app.use(express.static('Static'));

var numClientsLocal = 0;
var slideId = "";

io.of('/client').on('connection', function(socket) {  
    numClientsLocal++;
    socket.on('adduser', function() {
      console.log('Client connected');
      //provides slide number to incoming connections
		socket.emit('slideId', {'data': slideId});
		//update connected devices on console
      io.of('/console').emit('localClientNum', {'data': numClientsLocal});
    });

    socket.on('disconnect', function() {
        numClientsLocal--;
        //update connected devices on console
        io.of('/console').emit('clientNum', {'data': numClientsLocal});
        console.log('Client disconnected');
    });
});

var alreadyConnected = false;

io.of('/console').on('connection', function(socket) {  
    if (alreadyConnected) {
    	socket.emit('blockLoad');
		socket.disconnect(0);    
    }else{
    	socket.emit('allowLoad');
    }
    socket.on('adduser', function() {
    	alreadyConnected = true;
      console.log('Console connected');
    });
    
    socket.on('slideId', function(data) {
    	slideId = data.data;
    	io.of('/client').emit('slideId', {'data': data.data});
    	socket2m.emit('slideId', {'data': data.data});
    });
    
    socket.on('disconnect', function() {
        alreadyConnected = false;
        console.log('Console disconnected');
    });
});

server.listen(8080, "0.0.0.0");
