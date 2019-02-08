'use strict';
const payload = {
	type: "object",
	additionalProperties: false,
	required: ["lat", "lng"],
	properties: {
		lat: {
			type: "number"
		},
		lng: {
			type: "number"
		}
	}
}; 

const schema = require("../payloadWrapper")(payload);

module.exports = {
	schema,
	echo: false,
	publish: false,
	onEvent: function(socketState, channelState, event, cb){
		
		const oldGeo = {lat : socketState.lat, lon :  socketState.lon};
		const newGeo = {lat: event.lat, lon : event.lon};
		
		const newSocketState = {
			presentation : {$set : newGeo}
		};
		
		const newChannelState = {
			geometry : {
				coordinates : {
					$pull : oldGeo,
					$push : [newGeo] 
				}
			}
		};
		
		cb(true, newSocketState, newChannelState, event);
	}
};