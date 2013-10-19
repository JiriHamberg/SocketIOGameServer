function ClientUtils() {

	function waitingForOpponent(containerElement) {
		var num = Math.floor(new Date().getMilliseconds() / 250); //periodic 0...3
		var dots = new Array(num + 1).join("."); //hacky repeat string
		containerElement.innerHTML = "Waiting for an opponent";
		containerElement.innerHTML += dots;
	}

	this.addGameStateManager = function(socket, containerElement) {
		var waitingLoop;
		socket.on('join status', function(status) {		
			if(status === 'waiting') {
				waitingLoop = setInterval(function(){waitingForOpponent(containerElement);}, 250);
			}	
			else if(status === 'reject') {
				containerElement.innerHTML = "The game you tried to join has already started and does not allow observers";
			} else if(status === 'not found') {
				containerElement.innerHTML = "No game exists with given id";
			}
		});
		socket.on('game started', function() {
			clearInterval(waitingLoop);
			containerElement.innerHTML = '';
		});
		socket.on('game ended', function() {
			console.log("GAME ENDED!!!!!!");
			containerElement.innerHTML = "Game ended because one of the players disconnected";
		});
	};

}