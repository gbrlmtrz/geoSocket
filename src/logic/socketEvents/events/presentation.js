'use strict';
const payload = {
	type: "object",
	additionalProperties: false,
	required: ["name", "picture"],
	properties: {
		id: {
			type: "string"
		},
		name: {
			type: "string"
		},
		color: {
			type: "string",
			default: "ad1457"
		},
		picture: {
			type: "string",
			default: "001"
		}
	}
}; 

const schema = require("../payloadWrapper")(payload);


module.exports = {
	schema,
	echo: false,
	publish: true,
	onCreate: function(Channel){
		Channel.state.presentation = [];
	},
	onClose: function(socketState, newState){
		newState.presentation = {$pull : socketState.presentation};
	},
	onEvent: function(socketState, channelState, event, cb){
		const presentation = {id: socketState.id, ...event.payload};
		
		const newSocketState = {
			presentation : {$set : presentation}
		};
		const newChannelState = {
			presentation : {$push : [presentation]}
		};
		
		if(socketState.presentation)
			newChannelState.presentation.$pull = socketState.presentation;
		
		event.payload = presentation;
		cb(true, newSocketState, newChannelState, event);
	}
};