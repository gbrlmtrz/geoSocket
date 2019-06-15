const moment = require('moment');
const Response = require('./_Response');
const conn = require('../../database');
const Lang = require('../langs/server/es.json');
const objectCopy  = require("fast-copy").default;

class Database{
	
	constructor(collection = '', schema = {}){
		this.schema = objectCopy(schema);
		this.collection = collection;
		for(const key in this.schema){
			if(this.schema[key].hasOwnProperty("_$index")){
				this.createIndex(key, this.schema[key]._$index, this.schema[key].hasOwnProperty("_$unique"));
			}
		}
	}
	
	createIndex(key, index, unique = false){
		conn.getCollection(this.collection)
		.then( col => col.createIndex({[key]: index}, {unique : unique}))
		.then( r => console.log("indexResult", r))
		.catch( error =>{ throw new Error(error) });
	}
	
	insertOne(body = {}, lang = Lang){
		return new Promise((resolve, reject) => {
			conn.getCollection(this.collection)
			.then(col => col.insertOne(body))
			.then(res => {
				if(res.insertedCount == 1){
					body._id = res.insertedId;
					resolve(new Response(true, body));					
				}else{
					reject(new Response(false, lang.insertError));
				}
			})
			.catch(error => {
				console.log(error);
				reject(new Response(false, lang.insertError));
			});
		});
	}
	
	insertMany(body = [], lang = Lang){
		return new Promise((resolve, reject) => {
			conn.getCollection(this.collection)
			.then(col => col.insertMany(body))
			.then(res => {
				if(res.insertedCount == body.length){
					for(const key in body){
						body[key]._id = res.insertedIds[key];
					}
					resolve(new Response(true, body));					
				}else{
					reject(new Response(false, lang.insertError));
				}
			})
			.catch(error => {
				console.log(err);
				reject(new Response(false, lang.insertError));
			});
		});
	}
	
	updateOne(query = {}, body = {}, extra = {upsert : true}, lang = Lang){
		return new Promise((resolve, reject) => {
			
			conn.getCollection(this.collection)
			.then(col => col.updateOne(query, body, extra))
			.then(res => {
				
				if(res.modifiedCount == 1){
					resolve(new Response(true, body));					
				}else if(res.upsertedCount == 1){
					body._id = res.upsertedId;
					resolve(new Response(true, body));	
				}else{
					reject(new Response(false, lang.updateError));
				}
			})
			.catch(error => {
				reject(new Response(false, lang.updateError));
			});
		});
	}
	
	deleteOne(filter = {}, lang = Lang){
		return new Promise((resolve, reject) => {
			
			conn.getCollection(this.collection)
			.then(col => col.deleteOne(filter))
			.then( res => {
				if(res.deletedCount == 1){
					resolve(new Response(true, 1));
				}else{
					reject(new Response(false, lang.removeError));
				}
			})
			.catch( error => {
				reject(new Response(false, lang.removeError));
			});
		});
	}
	
	deleteMany(filter = {}, lang = Lang){
		return new Promise((resolve, reject) => {
			
			conn.getCollection(this.collection)
			.then(col => col.deleteMany(filter))
			.then( result => {
				resolve(new Response(true, result.deletedCount));
			})
			.catch( err => {
				reject(new Response(false, lang.removeError));
			});
		
		});
	}
	
	count(filter = {}, lang = Lang){
		return new Promise((resolve, reject) => {
			conn.getCollection(this.collection)
			.then(col => col.countDocuments(filter))
			.then( (count) => {
				resolve(new Response(true, count));
			})
			.catch( (err) => {
				console.log(err);
				reject(new Response(false, lang.countError));
			});
		});
	}
	
	select(filter = {}, sort = [], skip = -1, limit = -1, projection = {}, lang = Lang){
		return new Promise((resolve, reject) => {
			
			const options = {};
			
			if(sort.length > 0)
				options.sort = sort;
			
			if(skip >= 0)
				options.skip = skip;
			
			if(limit >= 0)
				options.limit = limit;
			
			if(projection.length > 0){
				options.projection = projection;
			}
			
			conn.getCollection(this.collection)
			.then(col => col.find(filter, options).toArray())
			.then( result => {
				resolve(new Response(true, result));
			})
			.catch( error => {
				console.log(error);
				reject(new Response(false, lang.searchError));
			});
		});
	}
	
	selectOne(find = {}, projection = {}, sort = [], lang = Lang){
		return new Promise((resolve, reject) => {
			const options = {
				projection : projection,
				sort : sort
			};
			
			conn.getCollection(this.collection)
			.then(col => col.findOne(find, options))
			.then( result => {
				if(result){
					resolve(new Response(true, result));
				}else{
					resolve(new Response(false, lang.searchNoResults));
				}
			})
			.catch( error => {
				console.log(error);
				reject(false, Lang.searchError);
			});
		});
	}
}

module.exports = Database;