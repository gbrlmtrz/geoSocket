const moment = require('moment');
const Response = require('./_Response');
const conn = require('../../database')("geosocket");
const uuid = require('uuid/v4');

class Database{
	
	constructor(table = '', schema = {}){
		this._schema = schema;
		this.table = table;
	}
	
	async insertOne(lang = {}, body = {}){
		return new Promise((resolve, reject) => {
			if(!body.hasOwnProperty("_id"))
				body._id = uuid();
			
			if(!body.hasOwnProperty("collection"))
				body.collection = this.table;
			
			conn.insert(body, (err, data) => {
				if(err){
					console.log(err);
					reject(new Response(false, lang.insertError));	
				}else{
					resolve(new Response(true, body));
				}
			});
			
		});
	}
	
	async insertMany(lang = {}, body = []){
		return new Promise((resolve, reject) => {
			
			for(const key in body){				
				body[key]._id = uuid();
				body[key].collection = this.table;
				
			}
			
			conn.bulk({docs:body}, (err, result) => {
				if(err){
					console.log(err);
					reject(new Response(false, lang.insertError));	
				}else{
					resolve(new Response(true, body));
				}
			});
			
		});
	}
	
	async updateOne(lang = {}, oldBody = {}, data = {}){
		return new Promise(async (resolve, reject) => {
			
			if(!oldBody._id)
				return reject(new Response(false, lang.mustSendID));
			
			data = {...oldBody, ...data, collection: this.table};
			
			if(!oldBody._rev){
				const oldDocument = await this.selectOne(lang, {_id : oldBody._id});
				
				if(!oldDocument.success)
					return reject(oldDocument);
				
				data = {...data, _rev : oldDocument.item._rev};
			}else{
				data = {...data, _rev : oldBody._rev};
			}
			
			conn.insert(data, async (err, res) => {
				if(err){
					reject(new Response(false, lang.updateError));
				}else{
					//await this.deleteOne(lang, data._id, data._rev);
					resolve(new Response(true, data));
				}
			});
		});
	}
	
	async deleteOne(lang = {}, id, rev){
		return new Promise(async (resolve, reject) => {
			
			if(!id)
				return reject(new Response(false, lang.mustSendID));
			
			if(!rev){
				const oldDocument = await this.selectOne(lang, {_id : id});
				
				if(!oldDocument.success)
					return reject(oldDocument);
				rev = oldDocument.item._rev;
			}
				
			
			conn.destroy(id, rev, (err, res) => {
				if(err){
					console.log(err);
					resolve(new Response(false, lang.deleteError));
				}else{
					resolve(new Response(true));
				}
			});
		});
	}
	
	/*async deleteMany(lang = {}, filter = {}){
		return new Promise((resolve, reject) => {
			this.table.deleteMany(filter)
			.then( result => {
				resolve(new Response(true, result.deletedCount));
			})
			.catch( err => {
				reject(new Response(false, lang.removeError));
			});
		});
	}
	
	async count(lang = {}, filter = {}){
		return new Promise((resolve, reject) => {
			this.table.count(filter)
			.then( (count) => {
				resolve(new Response(true, count));
			})
			.catch( (err) => {
				console.log(err);
				reject(new Response(false, lang.countError));
			});
		});
	}*/
	
	async select(lang = {}, filter = {}, order = [], skip = -1, limit = -1, fields = ''){
		return new Promise((resolve, reject) => {
			
			const query = {
				selector : {...filter, collection : this.table}
			};
			
			if(order.length > 0)
				query.order = order;
			
			if(skip >= 0)
				query.skip = skip;
			
			if(limit >= 0)
				query.limit = limit;
			
			if(fields.length > 0){
				fields = fields.split(",");
				if(fields.length > 0){
					query.fields = fields;
				}
			}
			
			conn.find(query, (err, result) => {
				if(err){
					console.log(err);
					reject(new Response(false, lang.searchError));
				}else{
					if(result.docs.length > 0)
						resolve(new Response(true, result.docs));
					else
						resolve(new Response(true, []));
				}
			});
		});
	}
	
	async selectOne(lang = {}, find = {}){
		return new Promise((resolve, reject) => {
			
			if(Object.keys(find).length == 1 && find._id && typeof find._id == "string"){
				conn.get(find._id, (err, result) => {
					if(err){
						resolve(new Response(false, lang.searchNoResults));
					}else{
						resolve(new Response(true, result));
					}
				});
			}else{
				const query = {
					selector : {...find, collection : this.table},
					limit: 1
				};
				
				conn.find(query, (err, result) => {
					if(err){
						reject(new Response(false, lang.searchError));
					}else{
						if(result.docs.length > 0)
							resolve(new Response(true, result.docs[0]));
						else
							resolve(new Response(false, lang.searchNoResults));
					}
				});
			}
		});
	}
}

module.exports = Database;