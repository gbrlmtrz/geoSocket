const Response = require(__dirname + '/_Response'),
	fs = require('fs');

const site = {
};

const server = {
};

class Lang{
	
	static async getLang(lang){
		
		if(server[lang] && Object.keys(server[lang]).length > 0)
			return server[lang];
		
		return new Promise( (resolve, reject) => {
			fs.readFile(`${__dirname}/../langs/server/${lang}.json`, (err, data) => {
				if (err){
					console.log(err);
					server[lang] = {};
				}else{
					server[lang] = JSON.parse(data);
				}
				resolve(server[lang]);
			})
		});
	}
		
	static async getSiteLang(lang){
		
		if(site[lang] && Object.keys(site[lang]).length > 0)
			return site[lang];
		
		return new Promise( (resolve, reject) => {
			fs.readFile(`${__dirname}/../langs/site/${lang}.json`, (err, data) => {
				if (err){
					console.log(err);
					site[lang] = {};
				}else{
					site[lang] = JSON.parse(data);
				}
				resolve(site[lang]);
			})
		});
	}
	
	static async listSiteLangs(){
		return new Promise( (resolve, reject) => {
			fs.readdir(`${__dirname}/../langs/site/`, (err, files) => {
				if(err)
					console.log(err);
				else{
					resolve(files || []);
				}
			});
		});
	}
	
	static async listLangs(){
		return new Promise( (resolve, reject) => {
			fs.readdir(`${__dirname}/../langs/server/`, (err, files) => {
				if(err)
					console.log(err);
				else{
					resolve(files || []);
				}
			});
		});
	}
	
}
module.exports = Lang;