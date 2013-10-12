var socket = io.connect();

var containerId = "gameContainer";
var gameTypeSelectionId = "gameTypeSelection";
var gameOptionsId = "gameOptions";
var allowObserversId = "allowObservers";
var descriptionInputId = "gameDescription";

socket.on('game created', function (gameInfo) {
	window.location = "/" + gameInfo.info.url + "?id=" + gameInfo.id;
});

socket.on('open games', function(gameListData) { //[{id:-- , info: --}, ...]
	renderGameList(gameListData);
});

socket.on('disconnect', function () {
	setTimeout(function() {
		window.location.reload();
	}, 250);
});

function renderGameList(gameListData) {
	var container = document.getElementById(containerId);

	container.innerHTML =	'<tr>' +
								'<td> Game type </td>' +
								'<td> Players </td>' +
								'<td> Creator </td>' +
								'<td> Description </td>' +
								'<td></td>' +
							'</tr>';

	for(var i=0; i<gameListData.length; i++){
		container.innerHTML += renderGameListEntry(gameListData[i]);
	}

	//attach link-like behaviour to each table row
	$('tr.game-table-row').click(function() {
        var href = $(this).find("a").attr("href");
        if(href) {
            window.location = href;
        }
    });
}

function renderGameListEntry(gameData) {
	var id = gameData.id;
	var type = gameData.info.type;
	var url = gameData.info.url;
	var playerCount = gameData.info.playerCount;
	var maxPlayers = gameData.info.maxPlayers;
	var creator = gameData.info.creator;
	var description = gameData.info.description;
	var joinType = playerCount < maxPlayers ? "Join" : "Watch"; 

	return '<tr class="game-table-row">' +
				'<td>' + type + '</td>' +
				'<td>' + playerCount + ' / ' + maxPlayers + '</td>' +
				'<td>' + creator + '</td>' +
				'<td>' + description + '</td>' +
				'<td>' +
					'<a class="game-link" href="/' + url + '?id=' + id +'">' + joinType + '</a>' +
				'</td>' +
			'</tr>';

	/*'<a href="/game?id=' + id + '">' +
			"Join game number " + id +
			'</a><br/>';*/
}

function createGame() {
	var gameTypeSelection = document.getElementById(gameTypeSelectionId);
	var type = gameTypeSelection.options[gameTypeSelection.selectedIndex].value;
	var allowObserversCheckBox = document.getElementById(allowObserversId);
	var descriptionTextInput = document.getElementById(descriptionInputId);

	var allowObservers = allowObserversCheckBox.checked;
	var description = descriptionTextInput.value;

	var options = {
		type: type,
		allowObservers: allowObservers,
		description: description
	}

	socket.emit('create game', options);
}