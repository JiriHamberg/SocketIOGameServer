
EMPTY = 0;
SUN = 1;
MOON = 2;
CHAOS = 3;

BOARD_H = 5;
BOARD_W = 5;

function getOpponent(token) {
	if(token == SUN) {
		return MOON;
	} else if(token == MOON) {
		return SUN;
	} else {
		throw Exception("Token must be SUN or MOON");
	}
}


function Board(){
	this.grid = [[MOON, EMPTY, MOON, EMPTY, MOON],
				[EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
				[EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
				[EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
				[SUN, EMPTY, SUN, EMPTY, SUN]];
	
	this.turn = SUN;
	this.lastMove = null;	
}

function isValidSquareForMove(grid, token, x, y) {
	if(grid[y][x] != EMPTY){
		return false;
	}
	var c1 = y-1>=0 && x-1>=0 && grid[y-1][x-1] == token;
	var c2 = x-1>=0 && grid[y][x-1] == token;
	var c3 = y+1<BOARD_H && x-1>=0 && grid[y+1][x-1] == token;
	var c4 = y-1>=0 && grid[y-1][x] == token;	
	var c5 = y-1>=0 && x+1<BOARD_W && grid[y-1][x+1] == token;
	var c6 = x+1<BOARD_W && grid[y][x+1] == token;
	var c7 = y+1<BOARD_H && grid[y+1][x] == token;
	var c8 = y+1<BOARD_H && x+1<BOARD_W && grid[y+1][x+1] == token;
	return c1 || c2 || c3 || c4 || c5 || c6 || c7 || c8;
}

function transformBoard(grid, token, x, y) {
	if(grid[y][x] == CHAOS) {
		grid[y][x] = token;
	}
	else if(grid[y][x] == SUN || grid[y][x] == MOON){
		grid[y][x] = CHAOS;
	}
}

Board.prototype.getValidMoves = function() {
	var validMoves = [];
	for(var i=0; i<BOARD_H; i++){
		for(var j=0; j<BOARD_W; j++){
			if(isValidSquareForMove(this.grid, this.turn, j, i)){
				validMoves.push([j, i]);
			}
		}
	}
};

Board.prototype.applyMove = function(x, y) {
	this.grid[y][x] = this.turn;
	this.lastMove = [x, y];

	if(y-1>=0 && x-1>=0){
		transformBoard(this.grid, this.turn, x-1, y-1);
	}
	if(x-1>=0){
		transformBoard(this.grid, this.turn, x-1, y);
	}
	if(y+1<BOARD_H && x-1>=0){
		transformBoard(this.grid, this.turn, x-1, y+1);
	}
	if(y-1>=0){
		transformBoard(this.grid, this.turn, x, y-1);
	}
	if(y-1>=0 && x+1<BOARD_W){
		transformBoard(this.grid, this.turn, x+1, y-1);
	}
	if(x+1<BOARD_W){
		transformBoard(this.grid, this.turn, x+1, y);
	}
	if(y+1<BOARD_H){
		transformBoard(this.grid, this.turn, x, y+1);
	}
	if(y+1<BOARD_H && x+1<BOARD_W){
		transformBoard(this.grid, this.turn, x+1, y+1);
	}

	if(this.turn == SUN){
		this.turn = MOON;
	} else if(this.turn == MOON) {
		this.turn = SUN;
	} else {
		throw new Exception("Turn must be either MOON or SUN");
	}

};

function Player(token){
	this.token = token;
}

exports.URL = 'equilibrio';

exports.Game = function() {
	this.board = new Board();
	this.p1 = new Player(SUN);
	this.p2 = new Player(MOON);
	this.creator = ""
	this.description = ""
	this.allowObservers = true;
	this.observers = []; // observer sockets

	this.makeMove = function(coordinates, player) {
		var x = coordinates[0];
		var y = coordinates[1];

		if(this.board.turn === player.token){
			if(isValidSquareForMove(this.board.grid, player.token, x, y)){
				this.board.applyMove(x, y);
				this.p1.socket.emit('game data', this.exportData(SUN));
				this.p2.socket.emit('game data', this.exportData(MOON));
				this.sendGameDataToObservers();
			} else { // invalid move
				player.socket.emit('invalid move');
			}
		} else { //not your turn
			player.socket.emit('not your turn');
		}
	};

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
			var game = this;
			this.p1.socket.on('make move', function(coordinates){
				game.makeMove(coordinates, game.p1);
			});
			this.p2.socket.on('make move', function(coordinates){
				game.makeMove(coordinates, game.p2);
			});
			this.p1.socket.emit('game started');
			this.p2.socket.emit('game started');
			this.p1.socket.emit('game data', this.exportData(SUN));
			this.p2.socket.emit('game data', this.exportData(MOON));			
		} else {
			if(this.hasStarted && status){
				//we are an observer, let's send the data
				socket.emit('game data', this.exportData(null));
			}
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
	}

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

	this.exportData = function(token) {
		return {
			grid: this.board.grid,
			lastMove: this.board.lastMove,
			turn: this.board.turn,
			token: token,
			players: this.exportPlayerNames(),
			observers: this.exportObserverNames()
		};
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

	this.exportInfo = function() {
		return {
			type: 'Equilibrio',
			url: exports.URL, 
			creator: this.creator,
			playerCount: this.getPlayerCount(),
			maxPlayers: 2,
			description: this.description
		};
	};

	this.sendGameDataToObservers = function() {
		for(var i=0; i<this.observers.length; i++) {
			try{
				this.observers[i].emit('game data', this.exportData(null));
			} catch(e){
				//not fatal
			}
		}
	};
};