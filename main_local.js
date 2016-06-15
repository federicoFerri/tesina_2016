var express = require('express'); 
var app = express();  
var server = require('http').createServer(app);  
var io = require('socket.io')(server);

app.use(express.static('Static'));

io.of('/client').on('connection', function(socket) {
    socket.on('joinRoom', function(data) {
    	var roomName = data.data;
      socket.join(roomName);
      //provides slide number to incoming connections
		socket.emit('slideId', {'data': slideIdArray[roomName]});   
    });
});

var roomsArray = [];
var slideIdArray = [];

function makeid()
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 5; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

function getRoomName() {
	do{
		var randomString = makeid();
	}while(roomsArray.indexOf(randomString) > -1);
	return randomString;
}

io.of('/console').on('connection', function(socket) {  
	 var roomName = getRoomName();    
    socket.join(roomName);
    roomsArray.push(roomName);
	 socket.emit('socketIp',{'data': roomName});    	
    	
    socket.on('slideId', function(data) {
    	slideIdArray[roomName] = data.data;
    	io.of('/client').to(roomName).emit('slideId', {'data': data.data});
    });
    
    socket.on('disconnect', function() {
        roomsArray.splice(roomsArray.indexOf(roomName), 1);
    });
});

//server.listen(8080);

server.listen(process.env.OPENSHIFT_NODEJS_PORT, process.env.OPENSHIFT_NODEJS_IP);