'use strict';
//const fs = require('fs');
const { join } = require('path');
const DIST_FOLDER = join(__dirname, '..', '..', 'dist');
const { existsSync, createReadStream, readFileSync, readdirSync, access } = require('fs');
const fastify = require('fastify');
const path = require('path');
const schemas = require('../logic/schemas');
const entities = require('../logic/Entities');
const routeTransformer = require('./utils/routeTransformer');
const authMaker = require('./utils/authMaker');
const autoauth = require('./preHandlers/autoauth');

const app = fastify({
	//logger: true,
	/*http2: true,
	https: {
		allowHTTP1: true, 
		key: readFileSync(path.join(__dirname, '..', '..', 'ssl', 'server.key')),
		cert: readFileSync(path.join(__dirname, '..', '..', 'ssl', 'server.crt'))
	}*/
});

app.register(require('fastify-static'), {root: join(DIST_FOLDER, 'geoSocketClient'), prefix: '/static/'});

app.register(require('fastify-compress'), {threshold: 2048});
app.register(require('fastify-favicon'), {path : join(DIST_FOLDER, 'geoSocketClient')});

/*app.register(require('fastify-favicon'), {path : __dirname});
app.register(require('fastify-cors'), { origin: '*', optionsSuccessStatus: 200 });*/

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

app.get('/robots.txt', (req, reply) => {
	reply.sendFile('Robots.txt');
});
app.get('/Robots.txt', (req, reply) => {
	reply.sendFile('Robots.txt');
});

app.get('/*', (req, reply) => {
	if(req.params['*'].length > 2)
		access(join(DIST_FOLDER, 'geoSocketClient', req.params['*']), (err) => {
			if(err){ 
				reply.sendFile('index.html');
			}
			else{
				reply.sendFile(req.params['*']);
			}
		});
	else
		reply.sendFile('index.html');
});

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