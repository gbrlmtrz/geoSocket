const indexOf = require('../../indexOf');
const update = require('immutability-helper');
const {extend} = update;

extend("$inc", function(value, original, spec){
	if(isNaN(value)) return;
	return original + value;
});

extend("$pull", function(value, original, spec){
	const index = indexOf(original, value);
	
	if(index > -1){
		original.splice(index, 1);
		return original;
	}else
		return original;
});

module.exports = update;