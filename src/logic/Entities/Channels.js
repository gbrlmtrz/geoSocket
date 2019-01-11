const config = require('config'),
	Base = require('./_Base');

let	Schema = require("../schemas/channels");
Schema = {...Schema};

class Channels extends Base{
	
	constructor(){
		super("channels", Schema.EntitySchema);
	}
	
}

module.exports = Channels;