'use strict';
const {getRedis} = require("../../redis");
const redis = getRedis("writer");
const Response = require("../../logic/Entities/_Response");

module.exports = {
	routes: [
		{
			method: 'GET',
			url: "/geofind/:lat/:lng", 
			schema: {
				params: {
					type: "object",
					additionalProperties: false,
					required : ["lat", "lng"],
					properties : {
						lat: {
							type: "number"
						},
						lng: {
							type: "number"
						}
					}
				},
				response: {
					"2xx": {
						type: "object",
						additionalProperties: false,
						required : ["success"],
						properties: {
							success: { 
								type: "boolean"
							}, 
							item: {
								type: "object", 
								additionalProperties: true,
								properties: {}
							},
							mes : {
								type: "string"
							}
						}
					}
				}
			}, 
			handler: function(req, reply){
				
			}
		},
		{
			method: 'GET',
			url: "/state/:id", 
			schema: {
				params: {
					type: "object",
					additionalProperties: false,
					properties : {
						id: {
							type: "string", 
							pattern: "^[0-9a-zA-Z-]{1,}$"
						}
					}
				},
				response: {
					"2xx": {
						type: "object",
						additionalProperties: false,
						required : ["success"],
						properties: {
							success: { 
								type: "boolean"
							}, 
							item: {
								type: "object", 
								additionalProperties: true,
								properties: {}
							},
							mes : {
								type: "string"
							}
						}
					}
				}
			}, 
			handler: function(req, reply){
				
				redis.get(`channel_${req.params.id}`)
				.then((result) => {
					if(state) state = JSON.parse(state);
					else state = {};
					reply.send(true, state);
				})
				.catch((err) => {
					console.log(err);
					reply.send(new Response(false, req.lang.databaseError));
				});
			}
		}	
	]
};