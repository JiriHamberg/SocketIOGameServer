
this.Chat = function (io) {
	var io = io;
	var messages = [];
	var historyLength = 50;

	this.onConnection = function(socket) {

		socket.broadcast.emit('joined chat', socket.nick);

		socket.emit('messages', messages);
		socket.emit('users', getAllNicks());

		socket.on('new message', function(message){
			if(valid(message)) {
				var msg = {nick: socket.nick, msg: strip(message)};
				messages.push(msg);
				io.sockets.emit('new message', msg);
				if(messages.length > historyLength) {
					messages.shift();
				}
			}
		});
	};

	this.onDisconnect = function(socket) {
		io.sockets.emit('left chat', socket.nick);
	};

	this.onNameChange = function(oldNick, newNick) {
		io.sockets.emit('users', getAllNicks());
		io.sockets.emit('server message', oldNick + " is now known as " + newNick );
	};

	function valid(message) {
		return typeof message === "string";
	}

	function getAllNicks() {
		nicks = [];

		io.sockets.clients().forEach(function (socket) { 
			nicks.push(socket.nick);
		});
		return nicks;
	}

	//strip html tags
	function strip(message) {
		message = message.replace(/>/g, '&gt;');
		message = message.replace(/</g, '&lt;');
		return message;
	}

};