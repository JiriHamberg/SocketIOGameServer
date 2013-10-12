var socket = io.connect();

socket.on('set name', function(newNick) {
	$("#nameContainer").text(newNick);
});

function onChangeName(){
	var newNick = $("#changeNameInput").val();
	$("#changeNameInput").val("");
	socket.emit('set name', newNick);
}