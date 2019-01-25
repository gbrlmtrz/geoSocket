'use strict';
const payload = {
	type: "object",
	additionalProperties: false,
	required: [],
	properties: {
		message: {
			type: "string"
		},
		quote: {
			type: "string"
		},
		media: {
			type: "string"
		}
	}
};

const schema = require("../payloadWrapper")(payload);


module.exports = {
	schema,
	echo: true,
	publish: true,
	eventHandler: function(socketState, channelState, event, cb){
		event.payload.date = Date.now();
		cb(true, socketState, channelState, event);
	}
};