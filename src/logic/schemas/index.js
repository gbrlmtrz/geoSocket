'use strict';
const {readdirSync} = require("fs");
const schemas = readdirSync(__dirname);
const exp = {};

for(const schema of schemas){
	if(schema.charAt(0) != "_" && schema != "index.js"){
		const name = schema.slice(0, -3);
		exp[name] = require(`./${name}`);
	}
}

module.exports = exp;