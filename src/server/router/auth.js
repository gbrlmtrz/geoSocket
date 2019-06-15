'use strict';
const Users = require('../../logic/Entities').Users.instance;
const Response = require('../../logic/Entities/_Response');
const config = require('config');

module.exports = async function(app, opts){
	
	app.route({
		method: 'POST',
		url: "/login", 
		schema: {
			querystring : {
				type: "object",
				additionalProperties: false,
				properties : {
					$lang: {
						type: "string", 
						default: "es"
					}
				}
			},
			body: {
				type: "object",
				additionalProperties: false,
				required: ["mail", "password"],
				properties : {
					mail: {
						type: "string"
					},
					password: {
						type: "string"
					}
				}
			},
			response: {
				'2xx' : {
					type: "object",
					additionalProperties: false,
					required : ["success"],
					properties: {
						success: { 
							type: "boolean"
						}, 
						expires : {
							type: "integer"
						},
						token : {
							type: "string"
						},
						mes : {
							type: "string"
						}
					}
				}
			}
		}, 
		handler: function(req, reply){
			
			Users.selectOne({mail: req.body.mail.toLowerCase()}, {_id: 1, password: 1, mail: 1}, [], req.lang)
			.then(user => {
				
				if(!user.success){
					reply.send(new Response(false, req.lang.authWrongEmailOrPassword));
					return;
				}
				
				
				Users.compareHashPass(user.item.password, req.body.password)
				.then(match => {
					
					if(!match){
						reply.send(new Response(false, req.lang.authWrongEmailOrPassword));
					}
					
					Users.getJWT({_id : user.item._id}, config.get("Users.JWTLifeInDays"), req.lang)
					.then(token => {
						const response = new Response(true);
						response.token = token;
						response.expires = parseInt((Date.now() / 1000) + config.get("Users.JWTLifeInDays") * 24 * 60 * 60);
						reply.send(response);
					})
					.catch(e => {
						reply.send(e);
					});
				})
				.catch(e => {
					reply.send(e);
				});
			})
			.catch(e => {
				console.log(e);
				reply.send(new Response(false, req.lang.authWrongEmailOrPassword));
			});
		}
	});
	
};