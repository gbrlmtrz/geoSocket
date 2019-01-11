'use strict';
const {user} = require("../../logic/Entities");
const Response = require("../../logic/Entities/_Response");

module.exports = function(orders){
	return function(req, reply, next){
		for(const order of orders){
			switch(order){
				case "isLogged":
					if(!req.user){
						reply.send(new Response(false, req.lang.invalidToken));
						return;
					}	
					break;
				default:
					if(!user.klass.hasOwnProperty(order) || !user.klass[order](req.user)){
						reply.send(new Response(false, req.lang.invalidToken));
						return;
					}
					break;
			}
		}
		next();
	};
};