const Base = require('../_Base');
const { EntitySchema } = require("../../schemas/channels");

class Channels extends Base{
	
	constructor(){
		super("channels", EntitySchema);
		this.createIndex("state.cid", 1, true);
	}
	
}

module.exports = Channels;