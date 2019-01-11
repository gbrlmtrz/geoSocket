const {User} = require('../../logic/Entities'),
	Response = require('../../logic/Entities/_Response');

const autoauth = function(req, reply, next){
	let jwtoken;
	
	if(req.headers.authorization)
		jwtoken = req.headers.authorization;
	
	req.user = false;
	if(jwtoken){
		
		User.checkHash(jwtoken)
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