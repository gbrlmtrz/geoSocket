'use strict';
const config = require('config');
const Cloudant = require('@cloudant/cloudant');
const cloudant = Cloudant(
	{
		account: config.get("cloudant.account"), 
		password: config.get("cloudant.password")
	}
);
const dbs = {};

module.exports = function(db){
	if(!dbs.hasOwnProperty(db))
		dbs[db] = cloudant.db.use(db);
	return dbs[db];
};