const privateKeys = [
	"_$linkedWith",
	
	"_$insertable",
	"_$updateable",
	"_$selfupdateable",
	"_$searchable",
	
	"_$insertRequired",
	"_$updateRequired",
	"_$selfupdateRequired",
	
	"_$inline",
	"_$required",
	"_$extraFilter",
	"_$index",
	"_$indexUnique",
	"_$pattern"
];

const queryActions = {
	integer: ["lt", "lte", "gt", "gte", "ne", "exists"],
	number: ["lt", "lte", "gt", "gte", "ne", "exists"],
	string: ["startswith", "endswith", "contains", "ne", "exists"],
	array: ["all", "in", "ne", "exists"],
	geopoint: ["point", "polygon", "intersects", "within", "near", "ne", "exists"]
};

const clean = function(body){
	body = {...body};
	for(let key of privateKeys)
		delete body[key];
	
	return body;
};

const basic = function(schema){
	const data = {};
	for(let key in schema){
		if(!schema[key].hasOwnProperty("_$private"))
			data[key] = clean({...schema[key]});
	}
	return data;
};

const process = function(schema, validKey, requiredKey = null, params = {}){
	const data = {
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
		params : params,
		body: {
			type: "object",
			additionalProperties: false,
			required: [],
			properties : {}
		},
		headers : {
			type: "object",
			additionalProperties: true,
			required: ["Authorization"],
			properties: {
				Authorization : {type: "string"}
			}
		},
		response: {
			'2xx' : toResponseSingle(schema)
		}
	};
	for(let key in schema){
		if(schema[key].hasOwnProperty(validKey)){
			data.body.properties[key] = clean({...schema[key]});
			if(requiredKey && schema[key].hasOwnProperty(requiredKey))
				data.body.required.push(key);
		}
	}
	return data;
};

const create = function(schema, params = {}){
	return process(schema, "_$insertable", "_$insertRequired", params);
};

const update = function(
schema,
params = {
	type: "object",
	additionalProperties: false,
	properties : {
		id: {
			type: "string", 
			pattern: "^[0-9a-fA-F]{24}$"
		}
	}
})
{
	return process(schema, "_$updateable", "_$updateRequired", params);
};

const updateSelf = function(schema){
	return process(schema, "_$selfupdateable", "_$selfupdateRequired");
};

const toResponseSingle = function(schema){
	return {
		type: "object",
		additionalProperties: false,
		_$required : ["success"],
		properties: {
			success: { 
				type: "boolean"
			}, 
			item: {
				type: "object", 
				properties: basic(schema)
			},
			mes : {
				type: "string"
			},
			deleteToken : {
				type: "boolean"
			}, 
			expires : {
				type: "integer"
			},
			token : {
				type: "string"
			}
		}
	};
};

const toResponseArray = function(schema){
	return {
		type: "object",
		_$required : ["success"],
		additionalProperties: false,
		properties: {
			success: {
				type: "boolean", 
				default: true
			}, 
			items: {
				type: "array", 
				items: {
					type: "object",
					properties: basic(schema)
				}
			},
			mes : {
				type: "string"
			},
			deleteToken : {
				type: "boolean"
			},
			total: {
				type: "integer"
			}
		}
	};
};

const remove = function(){
	const data = {
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
		params : {
			type: "object",
			additionalProperties: false,
			properties : {
				id: {
					type: "string", 
					pattern: "^[0-9a-fA-F]{24}$"
				}
			}
		},
		headers : {
			type: "object",
			additionalProperties: true,
			required: ["Authorization"],
			properties: {
				Authorization : {type: "string"}
			}
		},
		response: {
			'2xx' : {
				type: "object",
				additionalProperties: false,
				required : ["success"],
				properties: {
					success: { 
						type: "boolean", 
						default: true
					},
					mes : {
						type: "string"
					},
					deleteToken : {
						type: "boolean",
						default: false
					}
				}
			}
		}
	};
	return data;
};

const get = function(schema){
	const data = {
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
		params : {
			type: "object",
			additionalProperties: false,
			properties : {
				id: {
					type: "string", 
					pattern: "^[0-9a-fA-F]{24}$"
				}
			}
		},
		response: {
			'2xx' : toResponseSingle(schema)
		}
	};
	return data;
};

const retrieve = function(schema){
	const data = {
		querystring : {
			type: "object",
			additionalProperties: false,
			properties : {
				$lang: {
					type: "string", 
					default: "es"
				},/*
				query: {
					type: "object",
					additionalProperties: false,
					properties: {}
				},*/
				$limit: {
					type: "integer", 
					default: 20
				}, 
				$start: {
					type: "integer", 
					default: 0
				}, 
				$order: {
					type: "array", 
					default: [], 
					items: {
						type: "array", 
						default: null, 
						items: {
							type: "string"
						}
					}
				}, 
				$projection: {
					type: "object",
					additionalProperties: false,
					default: {},
					properties: {
						
					}
				}
			}
		},
		response: {
			'2xx' : toResponseArray(schema)
		}
	};
	for(let key in schema){
		if(schema[key].hasOwnProperty("_$searchable")){
			const clone = clean({...schema[key]});
			delete clone.default;
			data.querystring.properties[key] = clone;
			if(queryActions.hasOwnProperty(clone.type))
				for(const kkey of queryActions[clone.type])
					data.querystring.properties[`${key}_${kkey}`] = clone;
		}
	}
	return data;
};

module.exports = {
	create,
	update,
	updateSelf,
	remove,
	retrieve,
	get,
	toResponseSingle,
	toResponseArray
};