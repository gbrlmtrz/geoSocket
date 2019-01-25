'use strict';
//const fs = require('fs');
const fastify = require('fastify');
const path = require('path');
const schemas = require('../logic/schemas');
const entities = require('../logic/Entities');
const {existsSync, readdirSync, readFileSync} = require('fs');
const routeTransformer = require('./utils/routeTransformer');
const authMaker = require('./utils/authMaker');
const autoauth = require('./preHandlers/autoauth');

const app = fastify({
	//logger: true,
	http2: true,
	https: {
		allowHTTP1: true, 
		key: readFileSync(path.join(__dirname, '..', '..', 'ssl', 'server.key')),
		cert: readFileSync(path.join(__dirname, '..', '..', 'ssl', 'server.crt'))
	}
});

//app.register(require('fastify-ws'));
//app.register(require('fastify-sse'));
app.register(require('fastify-favicon'), {path : __dirname});
app.register(require('fastify-cors'), { origin: '*', optionsSuccessStatus: 200 });
//app.register(require('fastify-compress

app.decorateRequest('lang', {});
app.addHook('preHandler', require('./preHandlers/locale'));



const routeFiles = readdirSync(`${__dirname}/router`);


for(const route of routeFiles){
	if(route.charAt(0) != "_" && route != "index.js"){
		const name = route.slice(0, -3);
		app.register(require(`./router/${name}`), {prefix: `/${name}`});
	}
}

for(let key in schemas){
	if(schemas[key].hasOwnProperty('routes')){
		let routes = [];
		let addAuth = false;
		
		if(existsSync(`./router/_${key}.js`)){
			let module = require(`./router/_${key}.js`);
			routes = Array.isArray(module) ? module : module.routes;
			if(routes.addAuth) addAuth = true;
		}
		
		for(const routeDef of schemas[key].routes){
			let push = true;
			for(const route in routes){
				if(route.url == routeDef.url && route.method == routeDef.method){
					push = false;
					break;
				}
			}
			if(push){
				const obj = {
					url: routeDef.url,
					method: routeDef.method,
					schema: routeDef.schema,
					handler: routeTransformer(routeDef.entityFuntion, entities[key].instance)
				};
				
				if(routeDef.hasOwnProperty("auth") && Array.isArray(routeDef.auth)){
					addAuth = true;
					obj.beforeHandler = authMaker(routeDef.auth);
				}
				
				routes.push(obj);
			}
		}
		
		app.register(async function(route, opts, next){
			if(addAuth){				
				route.decorateRequest('user', false);
				route.addHook('preHandler', autoauth);
			}
			
			for(const r of routes){
				route.route(r);
			}
		}, {prefix: `/${key}`});
	}	
}

module.exports = {
	start(){
		app.listen(8082, '0.0.0.0', (err, addr) => {
			if(err){
				console.error(err)
			}
			
			console.log(`Server listening on ${addr} on proccess ${process.pid}`)
		});
	}
};