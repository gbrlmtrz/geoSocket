'use strict';

const functions = {
	doSelectFull(entity){
		return async function(req, reply){
			return await entity.doSelectFull(req.raw.lang, req.query, req.query.$order, req.query.$start, req.query.$limit, req.query.$projection);
		};
	},
	doInsert(entity){
		return async function(req, reply){
			return await entity.doInsert(req.raw.lang, req.body);
		}
	},
	doUpdate(entity){
		return async function(req, reply){
			const oldBody = await entity.doSelectOne(req.raw.lang,  {_id: req.params.id});
			if(!oldBody.success)
				return oldBody;
			
			return await entity.doUpdate(req.raw.lang, oldBody.item, req.body);
		}
	},
	doRemove(entity){
		return async function(req, reply){
			const oldBody = await entity.doSelectOne(req.raw.lang, {_id: req.params.id});
			if(!oldBody.success)
				return oldBody;
			
			return await entity.doRemove(req.raw.lang, oldBody.item._id, oldBody.item._rev);
		}
	},
	doSelectOneFull(entity){
		return async function(req, reply){
			return await entity.doSelectOneFull(req.raw.lang,  {_id: req.params.id});
		}
	}
};

module.exports = function(order, entity){
	if(functions.hasOwnProperty(order))
		return functions[order](entity);
};