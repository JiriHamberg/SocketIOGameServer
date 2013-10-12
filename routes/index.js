
/*
 * View rendering
 */

exports.index = function(req, res){
  res.render('index', { title: 'Games' });
};

/*exports.game = function(req, res){
	var gameId = req.query.id;
	console.log(gameId);
  	res.render('game', {title: 'Pong'});
};*/

exports.pong = function(req, res){
  	res.render('pong', {title: 'Pong'});
};

exports.equilibrio = function(req, res){
	res.render('equilibrio', {title: 'Equilibrio'});
};