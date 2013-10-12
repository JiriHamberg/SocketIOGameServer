var canvasId = "gameCanvas";
var statusBarId = "statusBar";

var boardImage = new Image();
boardImage.src = '../images/Board.png';
boardImage.onload = function() {
};

var SUN = 1;
var MOON = 2;
var CHAOS = 3;

var tokenSoundId = "tokenSound";

var boardModel = {
	width: 400,
	height: 400,
	offSetX: 60,
	offSetY: 60,
	gapX: 66.5,
	gapY: 66.5,
	r: 18,
	grid: [[],[],[],[],[]],
	turn: '',
	token: '',
	lastMove: [],
	players: [],
	observers: []
};


function sendMove() {
	var xInput = document.getElementById(xId);
	var yInput = document.getElementById(yId);
	var x = parseInt(xInput.value);
	var y = parseInt(yInput.value);
	socket.emit('make move', [x, y]);
}

var keys = {};
var gameId = getParamByName("id");
var lastUpdate = 0;

//waiting for opponent loop
var waitingLoop; 

var socket = io.connect();
socket.emit('join game', {gameId: gameId});

socket.on('join status', function(status) {
	var statusBar = document.getElementById(statusBarId);
	var gameStarted = boardModel.players.length >= 2;
	if(status === 'ok') {
		if(!gameStarted) {
			waitingLoop = setInterval(waitingForOpponent, 250);
		}	
	} else if(status === 'reject') {
		statusBar.innerHTML = "The game you tried to join has already started and does not allow observers";
	} else if(status === 'not found') {
		statusBar.innerHTML = "No game exists with given id";
	}

});

socket.on('game started', function() {
	gameStarted = true;
	clearInterval(waitingLoop);
	var statusBar = document.getElementById(statusBarId);
	statusBar.innerHTML = '';
	var canvas = document.getElementById(canvasId);
	canvas.addEventListener('click', onCanvasClick);
});

socket.on('game data', function (gameData) {
	boardModel.grid = gameData.grid;
	boardModel.lastMove = gameData.lastMove;
	boardModel.turn = gameData.turn;
	boardModel.token = gameData.token;
	boardModel.players = gameData.players;
	boardModel.observers = gameData.observers;
	buildGameView(gameData);
});

socket.on('game ended', function() {
	var canvas = document.getElementById(canvasId);
	var statusBar = document.getElementById(statusBarId);
	/*canvas.parentNode.removeChild(canvas);*/
	statusBar.innerHTML = "Game ended because one of the players disconnected";
});


function onCanvasClick(event) {
	var canvas = document.getElementById(canvasId);
	var x = event.clientX - canvas.offsetLeft;
	var y = event.clientY - canvas.offsetTop;

	function getClosestPoint(x1, y1){
	    for(var y=0; y<boardModel.grid.length; y++){
			for(var x=0; x<boardModel.grid[0].length; x++){
				var xCircle = boardModel.offSetX + x * boardModel.gapX; 
				var yCircle = boardModel.offSetY + y * boardModel.gapY;
				var distance = Math.sqrt(Math.pow(x1-xCircle, 2) + Math.pow(y1 - yCircle, 2));
				if(distance < boardModel.r) {
					return [x, y];
				}
			}
		}
		return null;
	}

	var point = getClosestPoint(x, y);
	//console.log(point);

	if(point !== null) {
		socket.emit('make move', point);
	}
}

function sendData(keyCode, value) {
//socket.emit('key event', {keyCode: keyCode, value: value});
}

function buildGameView(gameData) {
	document.getElementById(tokenSoundId).play();
	var turn = "";
	var token = "";
	if(boardModel.turn){
		var tokenType = boardModel.turn == 1 ? "Sun" : "Moon";
		turn = "<b>" + tokenType + "</b> to move";
	}
	if(boardModel.token){
		var tokenType = boardModel.token == 1 ? "Sun" : "Moon";
		token = "You are playing as <b>" + tokenType + "</b> <br/><br/>"; 
	}

	document.getElementById(statusBarId).innerHTML = token + turn;

	function drawCircle(x, y, r, color1, color2, context) {
	    var centerX = x + r / 2.0;
	    var centerY = y  + r / 2.0;
	  	context.beginPath();
	    context.arc(centerX, centerY, r, 0, 2 * Math.PI, false);
	    context.fillStyle = color1;
	    context.fill();
	    context.lineWidth = 2;
	    context.strokeStyle = color2;
	    context.stroke();
	    context.closePath();
	}

	function drawCircleOnPoint(x, y, r, color1, color2, context) {
		var xCircle = boardModel.offSetX + x * boardModel.gapX; 
		var yCircle = boardModel.offSetY + y * boardModel.gapY;
		drawCircle(xCircle, yCircle, r, color1, color2, context);
	}

	var canvas = document.getElementById(canvasId);
	var context = canvas.getContext("2d");
	var grid = gameData.grid;

	context.drawImage(boardImage, 0, 0, boardModel.width, boardModel.height);

	/*if(boardModel.lastMove){
		drawCircleOnPoint(boardModel.lastMove[0], boardModel.lastMove[1], boardModel.r, 'yellow', 'yellow', context);
	}*/

	for(var y=0; y<grid.length; y++){
		for(var x=0; x<grid[0].length; x++){
			if(grid[y][x] === SUN) {
				drawCircleOnPoint(x, y, boardModel.r - 3, 'red', 'red', context);
			} else if(grid[y][x] === MOON) {
				drawCircleOnPoint(x, y, boardModel.r - 3, 'blue', 'blue', context);
			} else if(grid[y][x] === CHAOS) {
				drawCircleOnPoint(x, y, boardModel.r - 3, 'black', 'black', context);
			}
		}
	}
}

function waitingForOpponent() {
	var statusBar = document.getElementById(statusBarId);
	var num = Math.floor(new Date().getMilliseconds() / 250); //periodic 0...3
	var dots = new Array(num + 1).join("."); //hacky repat string
	statusBar.innerHTML = "Waiting for an opponent";
	statusBar.innerHTML += dots;
}

//returns url param of given name
function getParamByName(name) {
	var match = RegExp('[?&]' + name +'=([^&]*)').exec(window.location.search);
	return match && decodeURIComponent(match[1].replace(/\+/g, ''));
}

