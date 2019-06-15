const Users = require('../../logic/Entities').Users.instance;
const Response = require('../../logic/Entities/_Response');

const autoauth = function(req, reply, next){
	req.user = {logged : false};
	
	if(req.headers.authorization){
		const jwtoken = req.headers.authorization;
		
		Users.checkHash(jwtoken, req.lang)
		.then(hashChecked)
		.catch(onError);
		
		const onError = function(e){
			const r = new Response(false);
			r.deleteToken = true;
			reply.send(r);
		};
		
		const hashChecked = function(user){
			if(user.success){
				req.user = user.item;
				next();
			}else{
				onError();
			}
		};
	}else{
		next();
	}
};

module.exports = autoauth;