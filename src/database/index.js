'use strict';
const config = require('config');
const { MongoClient } = require('mongodb');

let _db = null;
let connecting = false;

const promises = [];

const connect = function(){
	if(connecting) return;
	connecting = true;
	
	const client = new MongoClient(config.get("mongoAtlas.url"), { useNewUrlParser: true });
	
	client.connect()
	.then(() => {
		_db = client.db(config.mongoAtlas.dbName);
		for(const promise of promises){
			promise.resolve(_db);
		}
	})
	.catch(error => { throw new Error(error) });
	
};


const getDB = function(){
	return new Promise((resolve, reject) => {
		if(_db == null){
			promises.push({resolve, reject});
			connect();
		}else
			resolve(_db);
	});
};

module.exports = {
	getCollection : function(collection){
		return new Promise((resolve, reject) => {
			getDB()
			.then(db => {
				resolve(db.collection(collection));
			})
			.catch(error => { throw new Error(error) } );
		});
	}
};