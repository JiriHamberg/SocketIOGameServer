var canvasId = "gameCanvas";
var statusBarId = "statusBar";

var boardImage = new Image();
boardImage.src = '../images/Board.png';

var SUN = 1;
var MOON = 2;
var CHAOS = 3;

var tokenSoundId = "tokenSound";

var boardModel = {
	//static data
	width: 400,
	height: 400,
	offSetX: /*60*/ 67,
	offSetY: /*60*/ 67.5625,
	gapX: /*66.5*/ 66.75,
	gapY: /*66.5*/ 66.5,
	r: 18,
	//game state
	grid: [[],[],[],[],[]],
	turn: '',
	token: '',
	lastMove: [],
	players: [],
	observers: []
};

var gameId = getParamByName("id");
var socket = io.connect();
var utils = new ClientUtils();

socket.emit('join game', {gameId: gameId});


socket.on('game data', function (gameData) {
	boardModel.grid = gameData.grid;
	boardModel.lastMove = gameData.lastMove;
	boardModel.turn = gameData.turn;
	boardModel.token = gameData.token;
	boardModel.players = gameData.players;
	boardModel.observers = gameData.observers;
	buildGameView();
});

function onCanvasClick(event) {
	var canvas = document.getElementById(canvasId);
	var rect = canvas.getBoundingClientRect();
	var x = event.clientX - rect.left;
	var y = event.clientY - rect.top; 

	function getClosestPoint(x1, y1){
		var best = {point: null, distance: 1000};
	    for(var y=0; y<boardModel.grid.length; y++){
			for(var x=0; x<boardModel.grid[0].length; x++){
				var xCircle = boardModel.offSetX + x * boardModel.gapX; 
				var yCircle = boardModel.offSetY + y * boardModel.gapY;
				var distance = Math.sqrt(Math.pow(x1-xCircle, 2) + Math.pow(y1 - yCircle, 2));
				if(distance < boardModel.r && distance < best.distance) {
					best.point = [x, y];
					best.distance = distance;
				}
			}
		}
		return best.point;
	}

	var point = getClosestPoint(x, y);

	if(point !== null) {
		socket.emit('make move', point);
	}
}

function buildGameView() {
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
	    var centerX = x;
	    var centerY = y;
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
	var grid = boardModel.grid;

	context.drawImage(boardImage, 0, 0, boardModel.width, boardModel.height);

	/*if(boardModel.lastMove){
		drawCircleOnPoint(boardModel.lastMove[0], boardModel.lastMove[1], boardModel.r, '#000000', '#000000', context);
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

//returns url param of given name
function getParamByName(name) {
	var match = RegExp('[?&]' + name +'=([^&]*)').exec(window.location.search);
	return match && decodeURIComponent(match[1].replace(/\+/g, ''));
}

window.onload = function() {
	buildGameView();
	utils.addGameStateManager(socket, $('#statusBar').get(0));
	var canvas = document.getElementById(canvasId);
	canvas.addEventListener('click', onCanvasClick);
}