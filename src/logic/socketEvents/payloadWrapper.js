'use strict';
module.exports = function(payload){
	return {
		type: "object",
		additionalProperties: false,
		required: ["event", "sender", "payload"],
		properties: {
			sender: {
				type: "string"
			},
			event: {
				type: "string"
			},
			date: {
				type: "integer",
				maximum: 1555014442000
			},
			payload: {...payload}
		}	
	};
};