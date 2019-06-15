const Database = require('./_Database');
const Response = require('./_Response');
const { ObjectID } = require('mongodb');
const {makeData, makeFind} = require('../helpers/bodyMakers');
const Lang = require('../langs/server/es.json');

class Base extends Database{

	constructor(collection, schema){
		super(collection, schema);
	}
	
	processInlineBody(schema, body, data){
		for(let key in body){
			this.getInlineValue(schema, key, body[key], data);
		}
	}
	
	processBody(schema, body, data){
		for(let key in body){
			let parts, name, action;
			if(key !== "_id"){
				parts = key.split("_");
				name = parts[0] || "_id";
				action = parts[1];
			}else{
				name = key;
				action = "";
			}
			this.getValue(schema, name, body[key], action, data);
		}
	}
	
	async makeFind(body, schema){
		const data = await makeFind(schema || this.schema, body);
		return data;
	}
	
	async makeData(body, schema){
		const data = await makeData(schema || this.schema, body);
		return data; 
	}
		
	deleteFiles(files){
		if(!Array.isArray(files))
			files = [files];
		
		for(const file of files)
			FileUtils.deleteFile(file, true);
	}
	
	async processInline(lang = Lang, item){
		
		const promises = [], keys = [];
		let newItem = {};
		this.processInlineBody(this.schema, item, newItem);
		
		for(const key in this.schema){
			if(this.schema[key]._$linkedWith){
				keys.push(key);
				promises.push(this.schema[key]._$linkedWith.doSelectOneInline(lang, item[key]));
			}
		}
		
		if(promises.length > 0){
			const results = await Promise.all(promises);
			for(let key in results){
				if(results[key].success)
					newItem[keys[key]] = results[key].item;
			}
		}
		
		return newItem;
	}
	
	async process(item, lang = Lang){
		const promises = [], keys = [];
		
		for(const key in this.schema){
			if(this.schema[key]._$linkedWith && item[key] !== undefined){
				keys.push(key);
				promises.push(this.schema[key]._$linkedWith.doSelectOneFull(item[key], lang));
			}
		}
		
		if(promises.length > 0){
			const results = await Promise.all(promises);
			for(let key in results){
				if(results[key].success)
					item[keys[key]] = results[key].item;
			}
		}
		
		return item;
	}
	
	preInsert(data = {}, lang = Lang){
		return Promise.resolve(new Response(true));
	}
	
	postInsert(response, data = {}, lang = Lang){
		return Promise.resolve(response);
	}
	
	doInsert(body = {}, lang = Lang){
		return new Promise(async (resolve, reject) => {
			
			const data = await this.makeData(body);
			
			this.preInsert(data, lang)
			.then(async (r) => {
				
				for(const key in data){
					if(this.schema.hasOwnProperty(key)){
						
						if(this.schema[key].hasOwnProperty("_$linkedWith")){
							let r = await this.doSelectOne(data[key], lang);
							if(!r.success){
								resolve(new Response(false, lang[this.collection][this.schema[key]._$linkedWithMes]));
								return;
							}
						}
						
						if(this.schema[key].hasOwnProperty("_$unique")){
							let r = await this.doSelectOne({[key] : data[key]}, lang);
							if(r.success){
								resolve(new Response(false, lang[this.collection][this.schema[key]._$unique]));
								return;
							}
						}
					}
				}
							
				for(const key in this.schema){
					if(this.schema[key].hasOwnProperty("_$insertRequired") && !data.hasOwnProperty(key)){
						resolve(new Response(false, lang[this.collection][this.schema[key]._$insertRequired]));
						return;
					}
				}
				
				
				if(Object.keys(data).length == 0){
					resolve(new Response(false, lang.emptyBodyError));
					return;
				}
				
				data.inserted = Date.now();
					
				this.insertOne(data, lang)
				.then(response => this.postInsert(response, data, lang))
				.then(resolve)
				.catch(reject);
			})
			.catch(reject);
		});
	}
	
	preUpdate(oldBody = {}, data = {}, query = {}, lang = Lang){
		return Promise.resolve(new Response(true));
	}
	
	postUpdate(response, oldBody = {}, data = {}, query = {}, lang = Lang){
		response.item = {...oldBody, ...data.$set};
		return Promise.resolve(response);
	}
	
	doUpdate(oldBody = null, body = {}, filter = {}, lang = Lang){
		return new Promise(async (resolve, reject) => {
			
			if(oldBody == null){
				reject(new Response(false, lang.mustSendOldBody));
				return;
			}
			
			const data = await this.makeData(body);
			const query = await this.makeFind(filter);

			this.preUpdate(oldBody, data, query, lang)
			.then((r) => {
				
				
				for(const key in data){
					if(this.schema.hasOwnProperty(key)){
						
						if(this.schema[key].hasOwnProperty("_$linkedWith")){
							let r = this.schema[key]._$linkedWith.doSelectOne(data[key], lang);
							if(!r.success){
								resolve(new Response(false, lang[this.collection][this.schema[key]._$linkedWithMes]));
								return;
							}
						}
						
						if(this.schema[key].hasOwnProperty("_$unique")){
							let r = this.doSelectOne({[key] : data[key], "_id_ne" : new ObjectID(oldBody._id)}, lang);
							if(r.success){
								resolve(new Response(false, lang[this.collection][this.schema[key]._$unique]));
								return;
							}
						}
					}
				}
				
				
				if(Object.keys(data).length == 0 || Object.keys(query) == 0){
					resolve(new Response(false, lang.emptyBodyError));
					return;
				}
				
				data.lastUpdate = Date.now();

				this.updateOne(query, {$set : data}, {upsert : true}, lang)
				.then(response => this.postUpdate(response, oldBody, data, query, lang))
				.then(resolve)
				.catch(reject);
			})
			.catch(reject);
		});
	}
	
	preRemove(find = {}, lang = Lang){
		return Promise.resolve(new Response(true));
	}
	
	postRemove(response, find, lang = Lang){
		return Promise.resolve(response);
	}
	
	doRemove(filter = {}, lang = Lang){
		return new Promise(async (resolve, reject) => {
			
			let find = await this.makeFind(filter);
			
			this.preRemove(find)
			.then((r) => {
				
				if(Object.keys(find) == 0){
					resolve(new Response(false, lang.emptyBodyError));
				}
				
				this.select(filter, [], -1, -1, {}, lang)
				.then(items => {
					if(!items.success)
						return new Response(false, lang.searchError);
					
					if(items.items.length == 0)
						return new Response(false, lang.nothingToRemove);
					
					for(const item in items.items)
						this.itemRemoval(item);
					
					return this.deleteMany(find, lang);
				})
				.then(response => this.postRemove(response, find, lang))
				.then(resolve)
				.catch(reject);
				
			})
			.catch(reject)
		});
	}
	
	async doSelect(body = {}, order = [], skip = -1, limit = -1, projection = {}, lang = Lang){
		let data = await this.makeFind(body);
		let res = await this.select(data, order, skip, limit, projection, lang);
		return res;
	}
	
	async doSelectFull(body = {}, order = [], skip = -1, limit = -1, projection = {}, lang = Lang){
		
		let data = await this.makeFind(body);
		
		let res = await this.select(data, order, skip, limit, projection, lang);
		
		if(res.success && res.items.length > 0){
			res.items = await Promise.all( res.items.map( async (item) => {
				return this.process(item, lang);
			}) );
		}
		return res;
	}
	
	async doSelectFullInline(body = {}, order = [], skip = -1, limit = -1, projection = {}, lang = Lang){
		let data = await this.makeFind(body);
		let res = await this.select(data, order, skip, limit, projection, lang);
		
		if(res.success && res.items.length > 0){
			res.items = await Promise.all( res.items.map( async (item) => {
				return this.processInline(item, lang);
			}) );
		}
		return res;
	}
	
	async doSelectOne(body, lang = Lang){
		let data;
		
		if(typeof body == "object"){
			data = await this.makeFind(body);
		}else if(ObjectID.isValid(body)){
			data = {_id : new ObjectID(body)};
		}else
			return new Response(false, lang.searchNoBody);
		
		return await this.selectOne(data, {}, {}, lang);
	}
	
	async doSelectOneInline(item, lang = Lang){
		if(item === undefined)
			return new Response(false, item);
		
		if(ObjectID.isValid(item)){
			let promise = await this.selectOne({"_id": item}, {}, {}, lang);
			if(!promise.success)
				return new Response(false, item);
			item = promise.item;
		}
		
		let inline = "";
		for(const key in this.schema){
			if(this.schema[key].inline){
				inline += this._inlineParsers[this.schema[key].type](item[key], this.schema[key]) + " ";
			}
		}
		
		return new Response(true, inline.trim());
	}
	
	async doSelectOneFull(item, lang = Lang){
		if(item === undefined)
			return new Response(false, item);
		
		if(ObjectID.isValid(item)){
			let promise = await this.selectOne({"_id": item}, {}, {}, lang);
			if(promise.success){
				return new Response(true, await this.process(promise.item, lang));
			}else return promise;
		}else if(typeof item === 'object'){
			return new Response(true, await this.process(item, lang));
		}
	}
	
	async doCount(body, lang = Lang){
		let data = await this.makeFind(body);
		return await this.count(data, lang);
	}

}

module.exports = Base;