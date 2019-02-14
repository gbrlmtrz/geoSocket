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
		},
		photo: {
			type: "object",
			additionalProperties: false,
			require: ["blob"],
			properties: {
				blob : {
					type: "array"
				},
				filter : {
					type: "string"
				}
			}
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
		if(event.payload.media && !Array.isArray(event.payload.media)){
			const media = [];
			for(let key in event.payload.media){
				media.push(event.payload.media[key]);
			}
			event.payload.media = media;
		}
		
		const echo =   {...event};
		echo.payload = { id : event.payload.id};
		cb(true, null, null, event, echo);
	}
};