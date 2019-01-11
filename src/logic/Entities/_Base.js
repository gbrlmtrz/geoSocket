const Database = require('./_Database');
const Response = require('./_Response');
const UUIDValidate = require('uuid-validate');
const uuid = require('uuid/v4');
const {makeData, makeFind} = require('../helpers/bodyMakers');

class Base extends Database{

	constructor(table, schema, valueParsers){
		super(table, schema, valueParsers);
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
		const data = await makeFind(schema || this._schema, body);
		return data;
	}
	
	async makeData(body, schema){
		const data = await makeData(schema || this._schema, body);
		return data; 
	}
		
	async deleteFiles(files){
		if(!Array.isArray(files))
			files = [files];
		
		for(const file of files)
			FileUtils.deleteFile(file, true);
	}
	
	async handleRemove(lang, item){
		
	}
	
	async processInline(lang, item){
		
		const promises = [], keys = [];
		let newItem = {};
		this.processInlineBody(this._schema, item, newItem);
		
		for(const key in this._schema){
			if(this._schema[key].linkedWith){
				keys.push(key);
				promises.push(this._schema[key].linkedWith.doSelectOneInline(lang, item[key]));
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
	
	async process(lang, item){
		const promises = [], keys = [];
		for(const key in this._schema){
			if(this._schema[key].linkedWith && item[key] !== undefined){
				keys.push(key);
				promises.push(this._schema[key].linkedWith.doSelectOneFull(lang, item[key]));
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
	
	async doInsert(lang, body){
		let data = await this.makeData(body);
		if(Object.keys(data).length > 0){
			
			for(const key in this._schema){
				if(this._schema[key].required && !data[key]){
					return new Response(false, lang[this._schema[key].required]);
				}
			}
			
			let res = await this.insert(lang, data);
			return res;
		}else
			return new Response(false, lang.emptyBodyError);
	}
	
	async doUpdate(lang, oldBody, body){
		let data = await this.makeData(body);
		data.lastUpdate = Date.now();
		if(Object.keys(data).length > 0){
			return await this.updateOne(lang, oldBody, data);
		}else
			return new Response(false, lang.emptyBodyError);
	}
	
	async doRemove(lang, id, rev){
		let res = this.deleteOne(lang, id, rev);
		return res;
	}
	
	async doSelect(lang, body, order, skip, limit, projection){
		let data = await this.makeFind(body);
		let res = await this.select(lang, data, order, skip, limit, projection);
		return res;
	}
	
	async doSelectFull(lang, body, order, skip, limit, projection){
		let data = await this.makeFind(body);
		
		let res = await this.select(lang, data, order, skip, limit, projection);
		if(res.success && res.items.length > 0){
			res.items = await Promise.all( res.items.map( async (item) => {
				return this.process(lang, item);
			}) );
		}
		return res;
	}
	
	async doSelectFullInline(lang, body, order, skip, limit){
		let data = await this.makeFind(body);
		let res = await this.select(lang, data, order, skip, limit);
		if(res.success && res.items.length > 0){
			res.items = await Promise.all( res.items.map( async (item) => {
				return this.processInline(lang, item);
			}) );
		}
		return res;
	}
	
	async doSelectOne(lang, body){
		let data = await this.makeFind(body);
		return await this.selectOne(lang, data);
	}
	
	async doSelectOneInline(lang, item){
		if(item === undefined)
			return new Response(false, item);
		if(UUIDValidate(item)){
			let promise = await this.selectOne(lang, {"_id": item});
			if(!promise.success)
				return new Response(false, item);
			item = promise.item;
		}
		
		let inline = "";
		for(const key in this._schema){
			if(this._schema[key].inline){
				inline += this._inlineParsers[this._schema[key].type](item[key], this._schema[key]) + " ";
			}
		}
		
		return new Response(true, inline.trim());
	}
	
	async doSelectOneFull(lang, item){
		if(item === undefined)
			return new Response(false, item);
		if(UUIDValidate(item)){
			let promise = await this.selectOne(lang, {"_id": item});
			if(promise.success){
				return new Response(true, await this.process(lang, promise.item));
			}else return promise;
		}else if(typeof item === 'object'){
			return new Response(true, await this.process(lang, item));
		}
	}
	
	async doCount(lang, body){
		let data = await this.makeFind(body);
		return await this.count(lang, data);
	}

}

module.exports = Base;