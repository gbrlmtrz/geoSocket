'use strict';
const Response = require("../../logic/Entities/_Response");
const { ObjectID } = require("mongodb");

const errorHandler = function(e, req, reply, errorKey){
	console.log(e);
	
	if(e instanceof Response)
		reply.send(e);
	else
		reply.send(new Response(false, req.lang[errorKey]));
};

const searchRoute = async function(Entity, req, reply){
	
	
	try{
		
		const count = await Entity.doCount(req.query, req.lang);
		
		if(!count.success){
			reply.send(count);
			return;
		}else if(count.item == 0 || count.item < req.query.$skip){
			const r = new Response(true, []);
			r.total = count.item; 
			reply.send(r);
			return;
		}
		
		const items = await Entity.doSelectFull(req.query, req.$order, req.$start, req.$limit, req.$projection, req.lang);
		
		if(items.success){
			items.total = count.item;
		}
		reply.send(items);
	}catch(e){
		errorHandler(e, req, reply, "searchError");
	}
}

const functions = {
	MakeSearch : function(Entity){
		return function(req, reply){
			searchRoute(Entity, req, reply);
		}
	},
	MakeSearchYours : function(Entity){
		return function(req, reply){
			if(req.user)
				req.query.user = new ObjectID(req.user._id);
			
			searchRoute(Entity, req, reply);
		}
	},
	MakeSelectOne : function(Entity){
		return async function(req, reply){
			try{
				return reply.send(await Entity.doSelectOneFull(new ObjectID(req.params.id), req.lang));
			}catch(e){
				errorHandler(e, req, reply, "searchError");
			}
		}
	},
	MakeSelectOneSelf : function(Entity){
		return async function(req, reply){
			try{
				return reply.send(await Entity.doSelectOneFull(new ObjectID(req.user._id), req.lang));
			}catch(e){
				errorHandler(e, req, reply, "searchError");
			}
		}
	},
	MakeSelectOneYours : function(Entity){
		return async function(req, reply){
			try{
				return reply.send(await Entity.doSelectOneFull({
					user: new ObjectID(req.user._id),
					_id : req.params.id
				}, req.lang));
			}catch(e){
				errorHandler(e, req, reply, "searchError");
			}
		}
	},
	MakeUpdateOne : function(Entity){
		return async function(req, reply){
			try{
				const query = {_id : req.params.id};
				
				const oldBody = await Entity.doSelectOne(query, req.lang);
				
				if(!oldBody.success){
					reply.send(oldBody);
					return;
				}
				
				reply.send(await Entity.doUpdate(oldBody.item, req.body, query, req.lang));
			}catch(e){
				errorHandler(e, req, reply, "updateError");
			}
		}
	},
	MakeUpdateOneSelf : function(Entity){
		return async function(req, reply){
			try{
				
				const query = {_id : new ObjectID(req.user._id)};
				
				const oldBody = await Entity.doSelectOne(query, req.lang);
				
				if(!oldBody.success){
					reply.send(oldBody);
					return;
				}
				
				reply.send(await Entity.doUpdate(oldBody.item, req.body, query, req.lang));
			}catch(e){
				errorHandler(e, req, reply, "updateError");
			}
		}
	},
	MakeUpdateOneYours : function(Entity){
		return async function(req, reply){
			try{
				const query = {user : new ObjectID(req.user._id), _id : req.params.id};
				
				const oldBody = await Entity.doSelectOne(query, req.lang);
				
				if(!oldBody.success){
					reply.send(oldBody);
					return;
				}
				
				reply.send(await Entity.doUpdate(oldBody.item, req.body, query, req.lang));
			}catch(e){
				errorHandler(e, req, reply, "updateError");
			}
		}
	},
	MakeRemoveOne : function(Entity){
		return async function(req, reply){
			try{
				const query = {_id : req.params.id};
				
				reply.send(await Entity.doRemove(query, req.lang));
			}catch(e){
				errorHandler(e, req, reply, "removeError");
			}
		}
	},
	MakeRemoveOneYours : function(Entity){
		return async function(req, reply){
			try{
				const query = {_id : req.params.id, user : new ObjectID(req.user._id)};
				
				reply.send(await Entity.doRemove(query, req.lang));
			}catch(e){
				errorHandler(e, req, reply, "updateError");
			}
		}
	},
	MakeRemoveOneSelf : function(Entity){
		return async function(req, reply){
			try{
				const query = { user : new ObjectID(req.user._id) };
				
				reply.send(await Entity.doRemove(query, req.lang));
			}catch(e){
				errorHandler(e, req, reply, "updateError");
			}
		}
	},
	MakeInsertOne : function(Entity){
		return async function(req, reply){
			try{
				reply.send(await Entity.doInsert(req.body, req.lang));
			}catch(e){
				errorHandler(e, req, reply, "insertError");
			}
		}
	},
	MakeInsertOneSelf : function(Entity){
		return async function(req, reply){
			const body = req.body;
			
			if(req.user)
				body.user = req.user._id;
	
			try{
				reply.send(await Entity.doInsert(body, req.lang));
			}catch(e){
				errorHandler(e, req, reply, "insertError");
			}
		}
	}
};

module.exports = function(order, Entity){
	if(functions.hasOwnProperty(order))
		return functions[order](Entity);
};