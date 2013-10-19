var canvasId = "pong";
var scoreFieldId = "score";

var keys = {};
var gameId = getParamByName("id");
var lastUpdate = 0;


var utils = new ClientUtils();

var socket = io.connect();
socket.emit('join game', {gameId: gameId});

socket.on('game data', function (gameData) {
	buildGameView(gameData);
});


addEventListener("keydown", keyDown);
addEventListener("keyup", keyUp);

function sendData(keyCode, value) {
	socket.emit('key event', {keyCode: keyCode, value: value});
}

function buildGameView(gameData) {
	var canvas = document.getElementById(canvasId);
	var context = canvas.getContext("2d");
	var scoreField = document.getElementById(scoreFieldId);
	//score
	scoreField.innerHTML = "Score: " + gameData.p1.score + " --- " + gameData.p2.score;
	//game window
	context.fillStyle = gameData.color;
	context.fillRect(0, 0, gameData.w, gameData.h);
	//p1
	context.fillStyle = gameData.p1.color;
	context.fillRect(gameData.p1.location[0], gameData.p1.location[1], gameData.p1.w, gameData.p1.h);
	//p2
	context.fillStyle = gameData.p2.color;
	context.fillRect(gameData.p2.location[0], gameData.p2.location[1], gameData.p2.w, gameData.p2.h);
	//ball
	context.fillStyle = gameData.ball.color;
	context.fillRect(gameData.ball.location[0], gameData.ball.location[1], gameData.ball.radius, gameData.ball.radius)
}

function keyDown(event) {
	sendData(event.keyCode, true);
	if(event.keyCode===40 || event.keyCode===38 ){
		event.preventDefault();	
	}
} 

function keyUp(event) {
	sendData(event.keyCode, false);
	if(event.keyCode===40 || event.keyCode===38 ){
		event.preventDefault();	
	}
}

//returns url param of given name
function getParamByName(name) {
	var match = RegExp('[?&]' + name +'=([^&]*)').exec(window.location.search);
	return match && decodeURIComponent(match[1].replace(/\+/g, ''));	
}
	
window.onload = function() {
	utils.addGameStateManager(socket, $('#score').get(0));
}
