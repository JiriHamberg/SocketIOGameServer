
function Player(game) { 
	this.game = game;
	this.score = 0;
	this.location = [50, 50];
	this.velocity = [0, 0];
	this.sensitivity = 200;
	this.h = 40;
	this.w = 10;
	this.color = "#FF0000";
	this.keys = {};
	
	Player.prototype.update = function(deltaT) {
		this.location[1] += this.velocity[1] * deltaT;
		if(this.location[1] < 0) {
			this.location[1] = 0;
			this.velocity[1] *= -1;
		}
		if(this.location[1] > this.game.h - this.h) {
			this.location[1] = this.game.h - this.h;
			this.velocity[1] *= -1;
		}
		
		this.velocity[1] *= 0.95;
	}
	
	Player.prototype.getBoundingRect = function() {
		return [this.location[0], this.location[1], this.w, this.h];
	}
	
	Player.prototype.setKey = function(keyCode, value) {
		this.keys[keyCode] = value;
	}

	Player.prototype.applyKeys = function(deltaT) {
		if(this.keys["38"]) { //up
			this.velocity[1] -= this.sensitivity * deltaT;
		}
		if(this.keys["40"]) { //down
			this.velocity[1] += this.sensitivity * deltaT;
		}
		
		if(this.velocity[1] < -100){
			this.velocity[1] = -100;
		}else if(this.velocity[1] > 100){
			this.velocity[1] = 100;
		}						
	}
	
	Player.prototype.exportData = function() {
		return {
			location: this.location,
			h: this.h,
			w: this.w,
			color: this.color,
			score: this.score
		};
	}
		
}

function Ball(game) {
	this.game = game;
	this.location = [0, 0];
	this.velocity = [0, 0];
	this.radius = 5;
	this.color = "#FFFF00";

	Ball.prototype.init = function() {
		this.location = [this.game.w / 2, this.game.h /2];
		this.velocity = [randomDirection() * 50, randomVal(-20, 20)];
	}
	
	Ball.prototype.getBoundingRect = function() {
		return [this.location[0], this.location[1], this.radius, this.radius];
	}
	
	Ball.prototype.update = function(deltaT) {
		this.location[0] += this.velocity[0]*deltaT;
		this.location[1] += this.velocity[1]*deltaT;
		
		if(this.location[1] < 0) {
			this.location[1] = 0;
			this.velocity[1] *=-1;
		}
		if(this.location[1] > this.game.h - this.getBoundingRect()[3]) {
			this.location[1] = this.game.h - this.getBoundingRect()[3];
			this.velocity[1] *=-1;
		}		
		if(this.location[0] < 0) {
			this.init();
			this.game.p2.score += 1;
		}
		if(this.location[0] > this.game.w) {
			this.init();
			this.game.p1.score += 1;
		}

		if( collides(this.getBoundingRect(), this.game.p1.getBoundingRect()) ) {
			this.velocity[0] *= -1;
			this.velocity[1] += this.game.p1.velocity[1];
			this.velocity[0] *= 1.05;
		} else if (collides(this.getBoundingRect(), this.game.p2.getBoundingRect())){  
			this.velocity[0] *= -1;
			this.velocity[1] += this.game.p2.velocity[1];
			this.velocity[0] *= 1.05;
		}
	}
	
	Ball.prototype.exportData = function() {
		return {
			location: this.location,
			radius: this.radius,
			color: this.color
		};
	}
		
} 

function randomVal(a, b) {
	return a + Math.random()*(b-a); 
}

function randomDirection() {
	return Math.random() > 0.5 ? 1 : -1 ;
}

//rects are arrays like [topleft_x, topleft_y, w, h] 
function collides(rect1, rect2) {
	function lineCollide(a, b, c, d) {
		return ((a <= c &&  c <= b) || (a <= d && d <= b)) || ((c <= a &&  a <= d) || (c <= b && b <= d));
	}
	return lineCollide(rect1[0], rect1[0] + rect1[2], rect2[0], rect2[0] + rect2[2]) && 
		lineCollide(rect1[1], rect1[1] + rect1[3], rect2[1], rect2[1] + rect2[3]);	
}

exports.URL = 'pong';

exports.Game = function() {
	this.creator = "";
	this.description = "";
	this.allowObservers = true;
	this.observers = [];
	this.hasStarted = false;
	this.h = 300;
	this.w = 650;
	this.color = "#000000";
	
	this.p1 = new Player(this);
	this.p2 = new Player(this);
	this.ball = new Ball(this);
	this.ball.init();
	
	this.p2.location = [600, 50];
	
	this.update = function(deltaT) {
		this.p1.update(deltaT);
		this.p2.update(deltaT);
		this.ball.update(deltaT);
		this.p1.applyKeys(deltaT);
		this.p2.applyKeys(deltaT);
		this.p1.socket.emit('game data', this.exportData());
		this.p2.socket.emit('game data', this.exportData());
		
		for(var i = 0; i< this.observers.length; i++) {
			try{
				this.observers[i].emit('game data', this.exportData());
			} catch(e) {
				//observers list has changed while iterating. some observers may not get
				//the data on this iteration. thats ok.
			}
		}
	}

	this.joinGame = function(socket) {
		var status = false;
		if(!this.p1.socket){
			this.p1.socket = socket;
			status = true;
		} else if (!this.p2.socket) {
			this.p2.socket = socket;
			status = true;
		} else if(this.allowObservers) {
			status = true;
			this.observers.push(socket);
		}

		if(!this.hasStarted && this.p1.socket && this.p2.socket) {
			this.hasStarted = true;
			this.p1.socket.emit('game started');
			this.p2.socket.emit('game started');		
		}
		return status;
	};

	this.getPlayer = function(socket) {
		if(this.p1.socket === socket) {
			return this.p1;
		} else if (this.p2.socket === socket) {
			return this.p2;
		} else {
			return undefined;
		}
	};

	this.getPlayerCount = function() {
		var count = 0;
		if(this.p1.socket){
			++count;
		}
		if(this.p2.socket){
			++count;
		}
		return count;
	};

	this.allowJoining = function() {
		return this.allowObservers || this.getPlayerCount() < 2;
	};

	this.destroy = function() {
		if(this.p1.socket) {
			this.p1.socket.emit('game ended');
			this.p1.socket.gameId = undefined;
		}
		if(this.p2.socket) {
			this.p2.socket.emit('game ended');
			this.p2.socket.gameId = undefined;
		}
	};


   /*
	* Disconnect API: disconnect should return true if the game should be ended. 
    */
	this.onDisconnect = function(socket) {
		if(!this.p1.socket || !this.p2.socket || socket === this.p1.socket || socket === this.p2.socket) {
			if(this.p1.socket) {
				this.p1.socket.emit('game ended');
				this.p1.socket.gameId = undefined;
			}
			if(this.p2.socket) {
				this.p2.socket.emit('game ended');
				this.p2.socket.gameId = undefined;
			}

			for(var i=0; i<this.observers.length; i++){
				this.observers[i].emit('game ended');
				this.observers[i].gameId = undefined;
			}
			return true;
		} else { // observer disconnected, no need to destroy the game
			var i = this.observers.indexOf(socket);
			if(i>=0){
				this.observers[i].gameId = undefined;
				this.observers.splice(i, 1); // remove the observer
			}
			return false; 
		}
	};

	this.exportPlayerNames = function() {
		return [this.p1.nick, this.p2.nick];
	};

	this.exportObserverNames = function() { 
		var nicks = [];
		for(var i=0; i<this.observers.length; i++) {
			nicks.push(this.observers[i].nick);
		}
		return nicks;
	};

	//data must not be circular
	this.exportData = function() {
		return {
			h: this.h,
			w: this.w,
			color: this.color,			
			p1: this.p1.exportData(),
			p2: this.p2.exportData(),
			ball: this.ball.exportData(),
			players: this.exportPlayerNames(),
			observers: this.exportObserverNames()
		};
	};

	this.exportInfo = function() {
		return {
			type: 'Pong',
			url: exports.URL,
			creator: this.creator, 
			playerCount: this.getPlayerCount(),
			maxPlayers: 2,
			description: this.description
		};
	};

}



