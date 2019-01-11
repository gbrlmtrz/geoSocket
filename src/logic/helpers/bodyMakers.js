const moment = require('moment');
const steed = require('./steedz')();
const UUIDValidate = require('uuid-validate');

const milesToRadian = (miles) => {
	return parseFloat(miles) / 3959;
};

const strReplace = ($f, $r, $s) => {
	return $s.replace(new RegExp("(" + (typeof($f) == "string" ? $f.replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&") : $f.map(function(i){return i.replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&")}).join("|")) + ")", "g"), typeof($r) == "string" ? $r : typeof($f) == "string" ? $r[0] : function(i){ return $r[$f.indexOf(i)]});
};

const clean = (name) => {
	var f=[' ','Š','Œ','Ž','š','œ','ž','Ÿ','¥','µ','À','Á','Â','Ã','Ä','Å','Æ','Ç','È','É','Ê','Ë','?','Ì','Í','Î','Ï','I','Ð','Ñ','Ò','Ó','Ô','Õ','Ö','Ø','Ù','Ú','Û','Ü','Ý','ß','à','á','â','ã','ä','å','æ','ç','è','é','ê','ë','?','ì','í','î','ï','i','ð','ñ','ò','ó','ô','õ','ö','ø','ù','ú','û','ü','ý','ÿ',' '],
		r=['','S','O','Z','s','o','z','Y','Y','u','A','A','A','A','A','A','A','C','E','E','E','E','E','I','I','I','I','I','D','N','O','O','O','O','O','O','U','U','U','U','Y','s','a','a','a','a','a','a','a','c','e','e','e','e','e','i','i','i','i','i','o','n','o','o','o','o','o','o','u','u','u','u','y','y',''];
	return strReplace(f,r,name).toLowerCase();		
}

const IP = {
	/*array: function(value, schema){
		if(typeof schema == "object"){
			this.proccessBody(schema.schema, value, value);
		}else if(typeof this._inlineParsers[schema] == "function"){
			value = this._inlineParsers[schema](value, schema);
		}
		return value;
	},
	objectid(key, cb){
		if(!ObjectID.isValid(this.data[key])) return "";
		return new ObjectID(this.data[key]).toString();
	},*/
	uuid(key, cb){
		return value;
	},
	string(key, cb){
		return value + "";
	},
	integer(key, cb){
		if(isNaN(value)) return;
		return parseInt(value);
	},
	number(key, cb){
		if(isNaN(value)) return;
		return parseFloat(value);
	},
	date(key, cb){
		format = format || 'YYYY-MM-DDTHH:mm:ss';
		return moment(value).format(format);
	},
	point(key, cb){
		if(!Array.isArray(value)) return "";
		for(let key in value){
			if(isNaN(value[key])) return;
			value[key] = parseFloat(value[key]);
		}
		return value.join(",");
	},
	polygon(key, cb){
		if(!Array.isArray(value)) return;
		let newCoordinates = [], calcA = 0;
		
		for(let i in value){
			newCoordinates.push(value[i].join(","));
		}
		//area = area(newCoordinates);
		
		newCoordinates.push(value[0].join(","));
		return newCoordinates.join("-");
	},
	bool(key, cb){
		switch(typeof value){
			case "string":
				switch(value.toLowerCase()){
					case "false":
					case "0":
						return "false";
					default:
						return "true";
				}
				break;
			case "int":
			case "float":
				return parseInt(value) > 0 ? "true" : "false";
				break;
			case "boolean":
				return value ? "true" : "false";
				break;
			case "undefined":
				return "false";
				break;
			default:
				return value == false  ? "true" : "false";
				break;
				
		}
	}
};	

const VPs = {
	array(key, cb){
		const schema = this.schema[key].items.properties;
		let value = [];
		const promises = [];
		if(!Array.isArray(this.data[key])){
			value.push(this.data[key]);
		}else
			value = this.data[key];
		
		for(const entry of value){
			promises.push(makeData(schema, entry));
		}
		
		Promise.all(promises)
		.then(results => {
			const returns = [];
			for(const result of results){
				if(Object.keys(result).length > 0){
					returns.push(result);
				}
			}
			if(returns.length > 0)
				cb(null, returns);
			else
				cb(null, null);
		})
		.catch( e => {
			cb(null, null);
		})
	},
	/*objectid(key, cb){
		if(!ObjectID.isValid(this.data[key])) {cb(null, null); return;}
		cb(null, new ObjectID(this.data[key]));
	},*/
	uuid(key, cb){
		let value = String(this.data[key]);
		if(UUIDValidate(value)){
			cb(null, value);
		}else{
			cb(null, null);
		}
	},
	string(key, cb){
		let value = String(this.data[key]);
		if(this.schema[key] !== undefined && typeof this.schema[key] == "object"){
			if(this.schema[key].minLength !== undefined && value.length < this.schema[key].minLength){
				cb(null, null);
				return;
			}
			if(this.schema[key].maxLength !== undefined && value.length > this.schema[key].maxLength){
				cb(null, null);
				return;
			}
			if(this.schema[key].pattern !== undefined && !this.schema[key].pattern.test(this.data[key])){
				cb(null, null);
				return;
			}
			if(this.schema[key].toLowerCase !== undefined)
				value = value.toLowerCase();
		}
		cb(null, value);
	},
	integer(key, cb){
		if(isNaN(this.data[key])) cb(null, null);
		let value = parseInt(this.data[key]);
		if(this.schema[key] !== undefined && typeof this.schema[key] == "object"){
			if(this.schema[key].minimum !== undefined && value < this.schema[key].minimum){
				cb(null, null);
				return;
			}
			if(this.schema[key].maximum !== undefined && value > this.schema[key].maximum){
				cb(null, null);
				return;
			}
		}
		cb(null, value);
	},
	number(key, cb){
		if(isNaN(this.data[key])){ cb(null, null); return;}
		let value = parseFloat(this.data[key]);
		if(this.schema[key] !== undefined && typeof this.schema[key] == "object"){
			if(this.schema[key].minimum !== undefined && value < this.schema[key].minimum){
				cb(null, null);
				return;
			}
			if(this.schema[key].maximum !== undefined && value > this.schema[key].maximum){
				cb(null, null);
				return;
			}
		}
		cb(null, value);
	},
	boolean(key, cb){
		switch(typeof this.data[key]){
			case "string":
				switch(this.data[key].toLowerCase()){
					case "false":
					case "0":
						cb(null, false);
						break;
					default:
						cb(null, true);
						break;
				}
				break;
			case "int":
			case "float":
				cb(null, parseInt(this.data[key]) > 0);
				break;
			case "boolean":
				cb(null, this.data[key]);
				break;
			case "undefined":
				cb(null, false);
				break;
			default:
				cb(null, this.data[key] == false);
				break;
				
		}
	},
	date(key, cb){
		if(!isNaN(this.data[key])){
			cb(null, parseInt(this.data[key])); 
			return;
		} 
			
		let date = moment(this.data[key]);
		if(!date.isValid()){
			cb(null, null);
			return;
		}
		
		cb(null, date.valueOf());
	},
	point(key, cb){
		if(!Array.isArray(this.data[key])){ 
			cb(null, null);
			return;
		}
		for(let key in this.data[key]){
			if(isNaN(this.data[key][key])){ 
				cb(null, null);
				return;
			}
			this.data[key][key] = parseFloat(this.data[key][key]);
		}
		cb(null, this.data[key]);
	},
	polygon(key, cb){
		if(!Array.isArray(this.data[key])){
			cb(null, null)
			return;
		}
		let newCoordinates = [], calcA = 0;
		
		for(let i in this.data[key]){
			newCoordinates.push(
				[
					parseFloat(this.data[key][i][0]), 
					parseFloat(this.data[key][i][1])
				]
			);
		}
		//area = area(newCoordinates);
		
		newCoordinates.push(
			[
				parseFloat(this.data[key][0][0]), 
				parseFloat(this.data[key][0][1])
			]
		);
		cb(null, newCoordinates);
	}
}

const Actions = {
	all(key, cb){
		let value = String(this.data[key]);
		if(!Array.isArray(value)) value = [value];
		cb(null, {
			$all : value,
			$size: value.length
		});
	},
	in(key, cb){
		let value = String(this.data[key]);
		if(!Array.isArray(value)) value = [value];
		cb(null, {
			$id: value
		});
	},
	point(key, cb){
		if(!Array.isArray(this.data[key])){
			cb(null, null);
			return;
		}
		cb(null, {
			type: "Point",
			coordinates : [this.data[key][0], this.data[key][1]] //lng, lat
		});
	},
	polygon(key, cb){
		if(!Array.isArray(this.data[key])){
			cb(null, null);
			return;
		}
		cb(null, {
			type:'Polygon',
			coordinates: [value]
		});
	},
	intersects(key, cb){
		if(!Array.isArray(this.data[key])){
			cb(null, null);
			return;
		}
		cb(null, {
			"$geometry" : { 
				type: "Point", 
				coordinates: [ this.data[key][0][0], this.data[key][0][1] ] 
			}
		});
	},
	within(key, cb){
		if(!Array.isArray(this.data[key])){
			cb(null, null);
			return;
		}
		cb(null, {
			$geoWithin : {
				$centerSphere : [
					[this.data[key][0], this.data[key][1]], 
					milesToRadian(this.data[key][2] || 1.24)
				]
			}
		});	
	},
	near(key, cb){
		if(!Array.isArray(this.data[key])){
			cb(null, null);
			return;
		}
		cb(null, {
			$near : {
				$geometry: { 
					type: "Point",  
					coordinates: [this.data[key][0], this.data[key][1]] //longitud, latitud 
				},
				$minDistance: this.data[key][2] || 1,
				$maxDistance: this.data[key][3] || 6000
			}
		});
	},
	gte(key, cb){
		cb(null, {
			$gte : this.data[key]
		});
	},
	lte(key, cb){
		cb(null, {
			$lte : this.data[key]
		});
	},
	gt(key, cb){
		cb(null, {
			$gt : this.data[key]
		});
	},
	lt(key, cb){
		cb(null, {
			$lt : this.data[key]
		});
	},
	startswith(key, cb){
		cb(null, {"$regex": new RegExp("^"+this.data[key],'gmi')});
	},
	endswith(key, cb){
		cb(null, {"$regex": new RegExp(this.data[key]+"$",'gmi')});
	},
	contains(key, cb){
		cb(null, {"$regex": new RegExp(this.data[key],'gmi')});
	},
	exists(key, cb){
		cb(null, {"$exists" : this.data[key]});
	},
	ne(key, cb){
		cb(null, {"$ne" : this.data[key]});
	},
	def(key, cb){
		cb(null, this.data[key])
	}
};

function ActionState(data){
	this.data = data;
}

function ValueState(schema, data){
	this.schema = schema;
	this.data = data;
}

function KeyState(schema, data, keys){
	this.schema = schema;
	this.data = data;
	this.keys = keys;
}

function getKeyAndAction(index, cb){
	const orgName = this.keys[index];
	let key = orgName;
	let parts, 
		name, 
		action, 
		underscore = false;
		
	if(key.startsWith("_")){
		underscore = true;
		key = key.substr(1);
	}
	
	parts	= key.split("_");
	name	= parts[0];
	action	= parts[1] || "def";
	
	if(underscore)
		name =  `_${name}`;
	
	if(this.schema.hasOwnProperty(name) && Actions.hasOwnProperty(action)){
		cb(null, {valid: true, name, action, orgName});
	}else
		cb(null, {valid: false, orgName});
}

async function applyFilter(key, cb){
	const promises = [];
	for(let kkey in this.data[key].values){
		
		const tempData = {}, tempCalls = {}, tempSchema = {};
		
		tempData[this.data[key].actions[kkey]] = this.data[key].values[kkey];
		tempCalls[this.data[key].actions[kkey]] = VPs[this.schema[key].$filter];
		tempSchema[this.data[key].actions[kkey]] = this.schema[key];
		
		promises.push(
			steed.parallel(new ValueState(tempSchema, tempData), tempCalls)
		);
		
	}
	const results = await Promise.all(promises);
	cb(null, results);
};

async function applyActions(key, cb){
	const obj = this.data[key], calls = {};
	for(let key in obj){
		calls[key] = Actions[key];
	}
	const results = await steed.parallel(new ActionState(obj), calls);
	let newObject;
	for(let key in results){
		if(typeof results[key] == "object"){
			if(newObject == null) 
				newObject = {...results[key]};
			else
				newObject = {...newObject, ...results[key]};
		}else{
			cb(null, results[key]);
			return;
		}
	}
	cb(null, newObject);
}

async function makeData(sch, dat){
	const orders = {};
	for(let key in dat){
		if(sch.hasOwnProperty(key)){
			orders[key] = VPs[sch[key].$filter];
		}
	}
	
	const results = await steed.parallel(new ValueState(sch, dat), orders);
	for(let key in results)
		if(results[key] === null)
			delete results[key];
	return results;
}

async function makeFind(sch, data){
	if(typeof data != "object") return {};
	
	const keys = Object.keys(data);
	if(keys.length == 0) return {};
	
	const calls = {};
	for(let index in keys){
		calls[index] = getKeyAndAction;
	}
	
	const results = await steed.parallel(new KeyState(sch, data, keys), calls)
	
	if(Object.keys(results).length == 0) return {};
	
	const toProccess = {};
	const toCall = {};
	
	for(const key in results)
		if(results[key].valid){
			if(toProccess[results[key].name] == null){
				toCall[results[key].name] = applyFilter;
				toProccess[results[key].name] = {
						actions: [results[key].action],
						values: [data[results[key].orgName]]
					};
			}else if(toProccess[results[key].name].actions.indexOf("def") == -1){
					if(results[key].action === "def"){
						toProccess[results[key].name].actions = [results[key].action];
						toProccess[results[key].name].values = [data[results[key].orgName]];
					}else{
						toProccess[results[key].name].actions.push(results[key].action);
						toProccess[results[key].name].values.push(data[results[key].orgName]);
					}
				}
		}else{
			delete data[results[key].orgName]
			delete results[key];
		}
		
	const valueResults = await steed.parallel(new ValueState(sch, toProccess), toCall);
	
	const newObject = {};
	const newCalls = {};
	for(const key in valueResults){
		
		for(const jay in valueResults[key]){
			for(const lay in valueResults[key][jay]){
				if(valueResults[key][jay][lay] !== null){
					if(newObject[key] == null){
						newObject[key] = {...valueResults[key][jay]};
						newCalls[key] = applyActions;
					}else
						newObject[key] = {...newObject[key], ...valueResults[key][jay]};
				}
			}
		}
	}
	
	const actionResults = await steed.parallel(new ActionState(newObject), newCalls);	
	return actionResults;
}

module.exports = {
	makeData,
	makeFind
};