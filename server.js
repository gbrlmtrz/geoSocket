// These are important and needed before anything else

const { join } = require('path');
const DIST_FOLDER = join(process.cwd(), 'dist');
const { createReadStream, readFileSync, access } = require('fs');
const template = readFileSync(join(DIST_FOLDER, 'geoSocketClient', 'index.html')).toString();

const env = process.argv[2] || 'dev';

const fastify = require('fastify');

const PORT = 8080;
const app = fastify({
	http2: true,
	https: {
		allowHTTP1: true, 
		key: readFileSync(join(__dirname, 'ssl', 'server.key')),
		cert: readFileSync(join(__dirname, 'ssl', 'server.crt'))
	}
});
app.register(require('fastify-static'), {root: join(DIST_FOLDER, 'geoSocketClient'), prefix: '/static/'});

app.register(require('fastify-compress'), {threshold: 2048});
app.register(require('fastify-favicon'), {path : join(DIST_FOLDER, 'geoSocketClient')});

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

app.listen(PORT, '0.0.0.0', function (err) {
	if (err) {
		throw err;
	}
	console.log(`server listening on ${app.server.address().port}`);
});