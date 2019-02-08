'use strict';
const payload = {
	type: "object",
	additionalProperties: false,
	required: [],
	properties: {
		id: {
			type: "string"
		},
		message: {
			type: "string"
		},
		quote: {
			type: "string"
		},
		media: {
			type: "array",
			//properties: {},
			//additionalProperties: true
		}
	}
};

const schema = require("../payloadWrapper")(payload);


module.exports = {
	schema,
	echo: true,
	publish: true,
	onEvent: function(socketState, channelState, event, cb){
		event.payload.date = Date.now();
		/*if(event.payload.media){
			const media = [];
			for(let key in event.payload.media){
				media.push(event.payload.media[key]);
			}
			event.payload.media = media;
		}*/
		cb(true, null, null, event);
	}
};