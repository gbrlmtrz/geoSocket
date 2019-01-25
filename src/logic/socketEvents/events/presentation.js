'use strict';
const payload = {
	type: "object",
	additionalProperties: false,
	required: ["name"],
	properties: {
		a: {
			type: "string"
		},
		a: {
			type: "number",
			default: 0
		}
	}
};

const schema = require("../payloadWrapper")(payload);


module.exports = {
	schema,
	echo: false,
	publish: true,
	eventHandler: function(socketState, channelState, event, cb){
		socketState.presentation = event.payload;
		cb(true, socketState, channelState, event);
	}
};