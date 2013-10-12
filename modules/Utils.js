exports.escapeHTML = function(string) {
	string = string.replace(/>/g, '&gt;');
	string = string.replace(/</g, '&lt;');
	return string;
};

exports.isValidUsername = function(object) {
	if(typeof object !== 'string'){
		return false;
	}
	if(object.length < 3 || object.length > 15) {
		return false;
	}
	//contains at least one alphabetic character
	return object.match(/[a-zA-Z]/g);
}