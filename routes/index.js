
/*
 * View rendering
 */

exports.index = function(req, res) {
  res.render('index', { title: 'Games' });
};

exports.info = function(req, res) {
	res.render('info', {title: 'About the app'});
};
