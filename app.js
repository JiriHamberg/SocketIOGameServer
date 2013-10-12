
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  ,	cookie = require('cookie')
  , app = express()
  , Session = require('connect').middleware.session.Session;

var sessionStore = {};
var secret = 'aaafda3fse3fra'; //session secret


app.configure(function () {
	app.set('port', process.env.PORT || 8080);
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.static(path.join(__dirname, 'public')));
	app.use(express.favicon());
	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(express.cookieParser());
  app.use(express.session({secret: secret, key: 'sid'}));
  app.use(handleSession);

  app.use(app.router);
});

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

var io = require('socket.io').listen(server); //web socket library
var chat = new (require("./modules/Chat")).Chat(io); //chat singleton
var utils = require("./modules/Utils"); //utilities

var nextGameId = 1; //game id counter
var nextUserId = 1; //user id counter
var games = {}; //container for all games
var fps = 20; //requested frames per second

/**
 * Games
 */
var pong = require('./games/Pong');
var equilibrio = require('./games/Equilibrio');

//console.log(pong);

if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);
//app.get('/game', routes.game);
app.get('/' + pong.URL, routes.pong);
app.get('/' + equilibrio.URL, routes.equilibrio);

/*
 * Middleware for session initialization
 */
function handleSession(request, response, next) {
  var sid = request.headers.cookie ?  cookie.parse(request.headers.cookie)['sid'] : undefined;
  //console.log("sid is: " + sid);

  if(sid && !sessionStore[sid]) {
    sessionStore[sid] = {name: "Anonymous_" + nextUserId };
    nextUserId++;
  }
  next(); 
}


io.set('authorization', function (handshakeData, accept) {
  if(handshakeData.headers.cookie) {
    var sid = cookie.parse(handshakeData.headers.cookie)['sid'];
    handshakeData.sid = sid;
    } else {
        return accept('No cookie transmitted', false);
    }
    accept(null, true);
  
});


io.sockets.on('connection', function(socket) {
  var sid = socket.handshake.sid;
  //console.log("sid is (sio): " + sid);
  if(!sessionStore[sid]){
    socket.disconnect();
    return;
  }
  socket.nick = sessionStore[sid].name; 

  chat.onConnection(socket);
  socket.emit('set name', socket.nick);
  socket.emit('open games', getOpenGames());

  socket.on('join game', function(data) {
    var id = data.gameId;

    //does the game exists?
    if(!games[id]) {
      socket.emit('join status', 'not found');
      return;
    }
    //does the allow the socket to join?
    if(!games[id].joinGame(socket)) {
      socket.emit('join status', 'reject');
      return;
    }
    socket.gameId = id;
    socket.emit('join status', 'ok');
    //update game list
    io.sockets.emit('open games', getOpenGames());
  });

  socket.on('set name', function(name) {
    //we are a bit rude here: invalid messages by the client are ignored
    if(!utils.isValidUsername(name)){
      return;
    }
    var nameInUse = false;
    io.sockets.clients().forEach(function(some_socket){
      if(some_socket.nick === name){
        nameInUse = true;
        return;
      }
    });
    //can't take same name as another user :P
    if(nameInUse){
      return;
    }
    name = utils.escapeHTML(name);
    var oldName = socket.nick;
    //TODO: good session service
    io.sockets.clients().forEach(function(some_socket){
      if(some_socket.handshake.sid === socket.handshake.sid) {
         some_socket.nick = name;
         some_socket.emit('set name', name);
      }
    });
    sessionStore[sid].name = name;
    chat.onNameChange(oldName, name);
    //TODO (maybe): game knows it's creators socket, not just string
    //io.sockets.emit('open games', getOpenGames());
  });

  socket.on('key event', function(keys) { //keys passed as data
    var gameId = socket.gameId;
    //checks that: 
    // 1) player is in a game
    // 2) the game actually exists
    // 3) the player is an actual player (not spectator)
    if(gameId && games[gameId] && games[gameId].getPlayer(socket)) {
      var player = games[gameId].getPlayer(socket);
      player.setKey(keys.keyCode, keys.value);
    }
  });

  socket.on('create game', function(options) {
    var type = options.type;
    var newId = nextGameId + "";
    nextGameId += 1;
    games[newId] = createGame(type); //new pong.Game();
    games[newId].allowObservers = options.allowObservers;
    games[newId].creator = socket.nick;
    //TODO: figure out a smart way to setup global configuration variables for both frontend and backend
    games[newId].description = utils.escapeHTML(options.description).substring(0, 25);
    socket.emit('game created', 
      {
        id: newId,
        info: games[newId].exportInfo()
      });
    io.sockets.emit('open games', getOpenGames());
  });

  socket.on('disconnect', function() {
    var gameId = socket.gameId;
    if(games[gameId]) {
      //onDisconnect(socket) returns true if this game should end after the 
      //given socket has disconnected
      var destroy = games[gameId].onDisconnect(socket);
      if(destroy) {
        delete games[gameId];
        io.sockets.emit('open games', getOpenGames());
      }
    }
    chat.onDisconnect(socket);
  });

});

setInterval(updateGames, 1000/fps);

setInterval(clearEmptyGames, 300000); 

function createGame(type) {
  if(type === 'pong') {
    return new pong.Game();
  } 
  else if(type === 'equilibrio'){
    return new equilibrio.Game();
  } else {
    return undefined;
  }
}

function getOpenGames() {
  var openGames = [];
  for (var gameId in games) {
    //console.log("game number: " + gameId);
      if (games.hasOwnProperty(gameId)) {
        if(games[gameId].allowJoining()) { //!games[gameId].hasStarted
          openGames.push({
            id: gameId,
            info: games[gameId].exportInfo()});
        }
      }
  }
  return openGames;
}

function updateGames() {
  for (var gameId in games) {
      if (games.hasOwnProperty(gameId)) {
        if(games[gameId].hasStarted) {
            try{
                games[gameId].update(1.0/fps);
            } catch(e){
              
            }
        }
      }
  }
}

function clearEmptyGames() {
  for (var gameId in games) {
      if (games.hasOwnProperty(gameId)) {
        if(games[gameId].exportInfo().playerCount === 0) {
            delete games[gameId];
        }
      }
  }
}




