'use strict';
const {readdirSync} = require("fs");
const entities = readdirSync(__dirname);
const exp = {};

for(const entity of entities){
	if(entity.charAt(0) != "_" && entity != "index.js"){
		
		const name = entity.slice(0, -3);
		const klass = require(`./${name}`);
		const obj = {
			klass : klass,
			instance : new klass()
		};
		
		exp[name] = obj;
		exp[name.toLowerCase()] = obj;
	}
}

module.exports = exp;