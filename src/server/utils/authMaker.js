'use strict';
const User = require("../../logic/Entities").Users.instance;
const Response = require("../../logic/Entities/_Response");

module.exports = function(privs){
	return function(req, reply, next){
		for(const priv in privs){
			if(!User.hasOwnProperty(priv.method) || !User[priv.method](req.user)){
				reply.send(new Response(false, req.lang.privs[priv.messageKey]));
				return false;
			}
		}
		next();
	};
};