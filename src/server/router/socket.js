'use strict';
const {getServer, start} = require('../../logic/socketManager');
const setUpEvents = require('../../logic/socketEvents');

module.exports = async function(app, opts){
	
	const wss = getServer(app.server, opts.prefix);
	setUpEvents();
	
	
	app.addHook('onClose', (fastify, done) => wss.close(done));
	app.ready(() => start() );
	
};