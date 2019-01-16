"use strict";
let wss;
let pingInterval;
const isValidCoordinates = require('is-valid-coordinates');
const os = require('os');
const {Server} = require("ws");
const config = require("config");
const objectCopy  = require("fast-copy").default;
const db = require("../../database")("geosocket");
const ChannelsEntity = require("../Entities").Channels.instance;
const {getChannelKey, getRedis} = require("../../redis");
const {findChannelByDistance, findChannelByIP, findPlaceNearby} = require("../channelFinder");
const URLParser = require("url").parse;
const uuid = require("uuid/v4");
const update = require("./immutability-helper")
const Ajv = require("ajv");
const ajv = new Ajv({
    coerceTypes: true,
    useDefaults: true,
    removeAdditional: true
});
const pub = getRedis("writer");
const sub = getRedis("subscriber");
const Channels = new Map();
const Events = new Map();
const ServerName = `${os.hostname()}-${process.pid}`;

const channelStates = new Map();
const channelPatches = new Map();
const hardUpdates = new Map();

const eventSchemaValidator = ajv.compile({
	type: "object",
	additionalProperties: false,
	required: ["event", "sender", "payload"],
	properties: {
		sender: {
			type: "string"
		},
		event: {
			type: "string"
		},
		payload: {
			additionalProperties : true,
			properties: {}
		}
	}	
});

const noop = function(){};

const eventNooper = function(socketState, channelState, event, cb){ cb(true, socketState, channelState, event); };

const addEvent = function(eventName, event){
	
	if(typeof(eventName) != "string")
		throw new Error(`Event's name must be a string ${typeof(eventName)} given`);		
	
	if(!event.schema)
		throw new Error("Event must include an schema");
	
	/*if(!eventSchemaValidator(event.schema))
		throw new Error("Event's schema doesn't match the required schema");*/
	
	if(event.hasOwnProperty("eventHandler") && typeof(event.eventHandler) != "function")
		throw new Error(`Event's eventHandler must be a function ${typeof(event.eventHandler)} given`);
	
	const newEvent = {
		validator: ajv.compile(event.schema),
		echo: event.echo || false,
		publish: event.publish || false,
		persists: event.persists || false,
		eventHandler: event.eventHandler || eventNooper
	};
	
	Events.set(eventName, newEvent);
};

const removeEvent = function(eventName){
	return Events.delete(eventName);
}

const possiblePatterns = ["event_", "server_", "updates_"];

const getChannelCommitFunction = function(channel){
	return function channelCommit(){
		pub.get(`channel_${channel}`, function(err, channelState){
			if(err){
				console.error(err);
				return;
			}
			
			channelState = tryJSONParse(channelState);
			
			if(!channelState.valid){
				console.error(channel, channelState);
				return;
			}
			
			channelState = channelState.item;
			
			if(channelState.state.connectedClients <= config.get("channelSettings.clientsToDissolve")){
				console.log("DISOLVE ME");
				publish(channel, {event: "findSuitor", sender: ServerName, payload: {clients: channelState.state.clients}});
			}
				
				
			ChannelsEntity.updateOne({}, channelState, channelState)
			.then(r => {
				clearTimeout(hardUpdates.get(channel));
				hardUpdates.delete(channel);
			})
			.catch(e => { 
				console.error("ChannelsEntity.updateOne", e);
				clearTimeout(hardUpdates.get(channel));
				hardUpdates.delete(channel);
			});
		});
	};
};

const getChannelUpdateFunction = function(key){
	return function channelUpdate(){
		clearTimeout(channelPatches.get(key).updates.timeout);
		const states = channelPatches.get(key).updates;
		channelPatches.delete(key);
		let obj = channelStates.get(key);
		for(const state of states){
			obj = update(obj, {state});
		};
		
		if(obj.state.connectedClients == 0){
			pub.del(`channel_${key}`, ()=>{});
			pub.del(`updater_${key}`, ()=>{});
			sub.unsubscribe(`updates_${key}`, (err) => { if(err) console.error(err); });
			if(hardUpdates.has(key)){
				clearTimeout(hardUpdates.get(key));
				hardUpdates.delete(key);
			}
			ChannelsEntity.deleteOne({}, key)
			.then(() => {
				console.log("Channel deleted");
			})
			.catch((e) => {
				console.error("ChannelsEntity.deleteOne", e);
			});
		}else{	
			channelStates.set(key, obj);
			pub.set(`channel_${key}`, JSON.stringify(obj), (err) => {
				if(err) console.error(err);
				if(!hardUpdates.has(key))
					hardUpdates.set(key, setTimeout(getChannelCommitFunction(key), config.get("channelSettings.commitUpdatesInSeconds") * 1000))
			});	
		}
	};
};

const onPMessage = function(chnl, message){
	const {channel, key} = getChannelKey(possiblePatterns, chnl);
	let objMessage = tryJSONParse(message);
	
	if(!objMessage.valid) return;
	
	objMessage = objMessage.item;
	
	switch(channel){
		case possiblePatterns[2]:
			if(!channelStates.has(key)) return; 
			if(!channelPatches.has(key)){
				channelPatches.set(key, {
					updates: [objMessage],
					timeout: setTimeout( getChannelUpdateFunction(key), 1000 / config.get("channelSettings.updatesPerSecond"))
				});
			}else{
				channelPatches.get(key).updates.push(objMessage);
			}
			break;
		case possiblePatterns[1]:
			switch(objMessage.command){
				case "terminate":
				default:
					const client = objMessage.client;
					const it = wss.clients.values();
					let found = false;
					let wsclients = it.next();
					while(!found || !wsclients.done){
						const ws = wsclients.value;
						if(ws.state.pcid == client){
							found = true;
							ws.send(JSON.stringify({event: "terminated", sender: ServerName, payload: {reason: objMessage.reason}}), err => {if(err) console.error(err)});
							ws.terminate();
						}
						wsclients = it.next();
					}
					break;
			}
			break;
		case possiblePatterns[0]:
		default:
			if(config.get("devMode")){
				objMessage.repeater = ServerName;
				message = JSON.stringify(objMessage);
			}
			
			if(!Channels.has(key)) return;
				
			switch(objMessage.event){
				case "findSuitor":
					for(const client of objMessage.payload.clients){
						if(Channels.get(key).has(client)){
							const socket = Channels.get(key).get(client);
							findSuitor(socket);
						}
					}
					break;
				case "switchChannel":
					for(const client of objMessage.payload.clients){
						if(Channels.get(key).has(client)){
							const socket = Channels.get(key).get(client);
							socket.switch = true;
							socket.onClose(null, null, objMessage.payload.toChannel);
						}
					}
					break;
				default:
					Channels.get(key).forEach(function(value, key){
						if(objMessage.sender != key){
							value.send(message, err => {if(err) console.error(err)} );
						}
					});
					break;
			}
			break;
	}
};

const loopSuitorChannels = function(socket, goodCandidate, channels){
	for(const channel of channels){
		if(channel._id == socket.state.channel)
			continue;
		
		if(channel.connectedClients >= config.get("channelSettings.maxClients")){
			continue;
		}
		 
		if(channel.connectedClients < config.get("channelSettings.clientsToDissolve")){
			goodCandidate = channel;
			return;
		}
		
		channel.abs = Math.abs(config.get("channelSettings.wantedClients") - channel.connectedClients);
		
		if(goodCandidate == null || channel.abs < goodCandidate.abs){ 
			goodCandidate = channel;
		}	 
	}
	return goodCandidate;
};

const findSuitor = function(socket){
	let goodCandidate = null;
	
	const channelsByIPCB = function(channelsByIP){
		if(channelsByIP.length > 0){
			goodCandidate = loopSuitorChannels(socket, goodCandidate, channelsByIP);
			if(goodCandidate){
				socket.switch = true;
				socket.onClose(null, null, goodCandidate._id);
				return;
			}
		}
		
		const channelsByLatLonCB = function(channelsByLatLon){
			if(channelsByLatLon.length > 0){
				goodCandidate = loopSuitorChannels(socket, goodCandidate, channelsByLatLon);
				if(goodCandidate){
					socket.switch = true;
					socket.onClose(null, null, goodCandidate._id);
					return;
				}
			}
		};
		
		findChannelByDistance(socket.state.lat, socket.state.lon, config.get("channelSettings.radius"))
		.then( channelsByLatLonCB )
		.catch( e => console.error("findChannelByDistance", e) );
	};
	
	findChannelByIP(socket.state.lat, socket.state.lon, socket.state.ip)
	.then(channelsByIPCB)
	.catch(e => console.error("findChannelByIP", e));
};

const publish = function(channel, payload){
	if(config.get("devMode"))
		payload.emiter = ServerName;
	
	pub.publish(`event_${channel}`, JSON.stringify(payload));
};

const getIPFromConnection = function(req){
	if(req.headers.hasOwnProperty("x-forwarded-for"))
		return req.headers["x-forwarded-for"].split("").pop();
	
	if(req.connection && req.connection.remoteAddress)
		return req.connection.remoteAddress;
	
	if(req.socket && req.socket.remoteAddress)
		return req.socket.remoteAddress;
};

const tryJSONParse = function(item){
	if(typeof(item) !== "string") 
		return {valid: false, item: item};
    
	try {
        item = JSON.parse(item);
    } catch (e) {
        return {valid: false};
    }

    if (typeof item === "object" && item !== null) {
        return {valid: true, item: item};
    }

    return {valid: false};
};

const checkForResponsableServersHealth = function(channel, state){	
	pub.get(`updater_${channel}`, (err, responsableServer) => {
		if(err){
			console.error(err);
			return
		}
		
		pub.get(`serverhb_${responsableServer}`, (err, lastHB) => {
			if(err){
				console.error(err);
				return
			}
			
			if(Date.now() - lastHB > config.get("socketServer.heartbeatInterval") * 2){
				
				sub.subscribe(`updates_${channel}`, (err, count) => { if(err) console.error(err); });
				pub.set(`updater_${channel}`, ServerName);
				
				channelStates.set(channel, state);
				
			}
		});
	});
};

const onPong = function() {
	this.isAlive = true;
};

const onClose = function(foo, bar, toChannel){
	if(Channels.has(this.state.channel)){
		Channels.get(this.state.channel).delete(this.state.id);
	}
	
	if(Channels.get(this.state.channel).size == 0){
		Channels.delete(this.state.channel);
		sub.unsubscribe(`event_${this.state.channel}`, (err) => { if(err) console.error(err); });
	}
	
	const cName = `channel_${this.state.channel}`;
	const socketState = objectCopy(this.state);
	
	
	if(config.get("channelSettings.keepOneConnectionPerPC")){
		pub.get(`client_${this.state.pcid}`, (err, client) => {
			if(err){
				console.error(err);
				return;
			}
			
			if(client != null){
				const pieces = client.split("<|>");
				if(pieces[1] == socketState.id)
					pub.del(`client_${socketState.pcid}`);
			}
		});
	}
	
	pub.get(cName, function(err, channelState){
		if(err){
			console.error(err);
			return;
		}
		
		channelState = tryJSONParse(channelState);
		
		if(!channelState.valid){
			console.error(cName, socketState, channelState);
			return;
		}
		
		channelState = channelState.item;
		channelState.state.connectedClients = channelState.state.connectedClients - 1;
		
		const newState = {
			connectedClients : { $inc : -1 },
			clients: { $pull : socketState.id },
			ips: { $pull : socketState.ip },
			geometry : { coordinates : {$pull: [socketState.lon, socketState.lat] } }
		};
		
		pub.publish(`updates_${socketState.channel}`, JSON.stringify(newState));
	});
	
	if(config.get("channelSettings.emitDisconnects"))
		publish(this.state.channel, {event: "disconnect", sender: this.state.id, payload: {peer: this.state.id}});
	
	if(toChannel){
		this.state.channel = toChannel;		
		this.send(JSON.stringify({event: "channelSwitch", sender: ServerName, payload: {toChannel: toChannel}}));
		onConnection(this);
	}
};

const onMessage = function(message){
	message = tryJSONParse(message);
	
	if(!message.valid) return;
	
	message = message.item;
	message.sender = this.state.id;
	
	if(eventSchemaValidator(message) && Events.has(message.event)){
		const event = Events.get(message.event);
		if(event.validator(message)){
			
			pub.get(`channel_${this.state.channel}`, (err, channel) => {
				if(err){
					console.error(err);
					return;
				}
				channel = JSON.parse(channel);
				
				const eventHandlerCB = (success, thisState, channelState, payload) => {
					if(!success) return;
					
					if(JSON.stringify(this.state) !== JSON.stringify(thisState))
						this.state = thisState;
					
					if(JSON.stringify(channelState.state) !== JSON.stringify(channelState))
						channel.state = channelState;
					
					if(event.publish)
						publish(this.state.channel, payload);
					
					if(event.echo)
						this.send(JSON.stringify(payload));
				};
				
				event.eventHandler(objectCopy(this.state), objectCopy(channel.state), message, eventHandlerCB);
			});
		}
	}
};

const onConnection = function(socket, request){
	socket.isAlive = true;
	
	if(!socket.hasOwnProperty("state")){
		const query = request.socketQuery;
		socket.state = {
			id: uuid(),
			pcid: query.pcid,
			lat: query.lat,
			lon: query.lon,
			ip: query.ip,
			channel: query.channel
		};
	}

	if(config.get("channelSettings.keepOneConnectionPerPC")){
		pub.get(`client_${socket.state.pcid}`, (err, client) => {
			if(err){
				console.error(err);
				return;
			}
			
			if(client != null){
				const pieces = client.split("<|>");
				if(pieces[0] != ServerName)
					pub.publish(`server_${pieces[0]}`, JSON.stringify({command: "terminate", client: socket.state.pcid, reason: "byOtherCon"}));
			}
			
			pub.set(`client_${socket.state.pcid}`, `${ServerName}<|>${socket.state.id}`);
		});
	}
	
	if(!Channels.has(socket.state.channel)){		
		sub.subscribe(`event_${socket.state.channel}`, (err, count) => { if(err) console.error(err); });
		Channels.set(socket.state.channel, new Map());
	}
	
	Channels.get(socket.state.channel).set(socket.state.id, socket);
	
	if(config.get("channelSettings.emitConnects"))
		publish(socket.state.channel, {event: "newPeer", sender: socket.state.id, payload:{id: socket.state.id}});
	
	
	pub.get(`channel_${socket.state.channel}`, (err, channel) => {
		if(err){
			console.error(err);
			return;
		}
		
		channel = JSON.parse(channel);
		
		channel.state.ips.push(socket.state.ip);
		channel.state.geometry.coordinates.push([socket.state.lon, socket.state.lat]);
		
		channel.state.clients.push(socket.state.id);
		channel.state.connectedClients = (channel.state.connectedClients || 0) + 1;
		
		const pChannel = objectCopy(channel.state);
		
		delete pChannel.ips;
		delete pChannel.geometry;
		
		socket.send(JSON.stringify({event: "channel", sender: ServerName, payload: {channel: pChannel}}));
		
		const newState = {
			connectedClients : { $inc : 1 },
			clients: { $push : [socket.state.id] },
			ips: { $push : [socket.state.ip] },
			geometry : { coordinates : { $push: [[socket.state.lon, socket.state.lat]] } }
		};
		
		pub.publish(`updates_${socket.state.channel}`, JSON.stringify(newState));
		
		checkForResponsableServersHealth(socket.state.channel, channel);
	});
	
	socket.onClose = onClose;
	socket.on('pong', onPong);
	socket.on("message", onMessage);
	socket.on("close", socket.onClose);
};

const getRandom = function(list){
	return list[Math.floor((Math.random()*list.length))];
};

const createChannel = function(query, filledChannels, cb){
	
	const findPlaceNearbyCB = function(placesNearby){
		let goodPlace = null;
		if(placesNearby.length > 0){
			if(placesNearby[0].distance < config.get("channelSettings.radius"))
				goodPlace = placesNearby[0];
		}
		
		const Channel = {
			_id: query.channel || uuid(),
			type: "Feature",
			collection: "channels",
			created: Date.now(),
			state: {
				connectedClients: 0,
				ips: [],
				clients: [],
				geometry: {
					type: "MultiPoint",
					coordinates: []
				}
			}
		};
		
		if(goodPlace){
			Channel.state.channelName = goodPlace.name;
			Channel.state.geometry.coordinates.push(goodPlace.geometry.coordinates);
		}	
		
		const ChannelEntityCB = function(response){
			if(!response.success){
				cb(false);
				return;
			}
			
			pub.set(`channel_${Channel._id}`, JSON.stringify(Channel), (err) => {
				if(err){
					console.error(err);
					cb(false);
					return;
				}
				
				sub.subscribe(`updates_${Channel._id}`, (err, count) => { if(err) console.error(err); });
				pub.set(`updater_${Channel._id}`, ServerName);
				
				channelStates.set(Channel._id, Channel);
				query.channel = Channel._id;
				cb(true);
				
				if(filledChannels.size > 0){
					if(filledChannels.size > (config.get("channelSettings.wantedClients")-1)){
						const values = filledChannels.values();
						for(let i = 0; i < (config.get("channelSettings.wantedClients")-1); i++){
							const {_id, state} = values.next().value;
							const client = getRandom(state.clients);
							publish(_id, {event: "switchChannel", sender: ServerName, payload:{toChannel: Channel._id, clients: [client._id]}});
						}
					}else{
						const it = filledChannels.values();
						let chn = it.next();
						let needed = config.get("channelSettings.wantedClients")-1
						while(!chn.done || needed > 0){
							const {_id, state} = chn.value;
							const available = Math.abs(state.connectedClients - needed);
							const clientsToSwitch = [];
							for(let i = 0; i < available; i++){
								let client;
								do{
									client = getRandom(state.clients);
								}while(clientsToSwitch.indexOf(client) >= 0);
								clientsToSwitch.push(client);
							}
							needed = needed - clientsToSwitch.length;
							publish(_id, {event: "switchChannel", sender: ServerName, payload:{toChannel: Channel._id, clients: clientsToSwitch}});
							chn = it.next();
						}
					}
				}
			});
		};
		
		ChannelsEntity.insertOne({}, Channel)
		.then(ChannelEntityCB)
		.catch( e => console.error("ChannelsEntity.insertOne", e));		
	};
	
	findPlaceNearby(query.lat, query.lon, config.get("channelSettings.radius"))
	.then( findPlaceNearbyCB )
	.catch( e => console.error("findPlaceNearby", e));
};

const loopChannels = function(query, goodCandidate, channels, filledChannels){
	for(const channel of channels){
		if(channel.connectedClients >= config.get("channelSettings.maxClients")){
			filledChannels.set(channel._id, channel);
			continue;
		}
		 
		if(channel.connectedClients < config.get("channelSettings.clientsToDissolve")){
			query.channel = channel._id;
			return;
		}
		
		channel.abs = Math.abs(config.get("channelSettings.wantedClients") - channel.connectedClients);
		
		if(goodCandidate == null || channel.abs < goodCandidate.abs){ 
			goodCandidate = channel;
		}	 
	}
	return goodCandidate;
};

const findChannel = function(query, cb){
	let goodCandidate = null;
	const filledChannels = new Map();
	
	const channelsByIPCB = function(channelsByIP){
		if(channelsByIP.length > 0){
			goodCandidate = loopChannels(query, goodCandidate, channelsByIP, filledChannels);
			if(query.channel){
				cb(true);
				return;
			}
		}
		
		const channelsByLatLonCB = function(channelsByLatLon){
			if(channelsByLatLon.length > 0){
				goodCandidate = loopChannels(query, goodCandidate, channelsByLatLon, filledChannels);
				if(query.channel){
					cb(true);
					return;
				}
			}
			
			if(goodCandidate){
				query.channel = goodCandidate._id;
				cb(true);
			}else{
				createChannel(query, filledChannels, cb);
			}
		};
		
		findChannelByDistance(query.lat, query.lon, config.get("channelSettings.radius"))
		.then(channelsByLatLonCB)
		.catch(e => console.error("findChannelByDistance", e));
	};
	
	findChannelByIP(query.lat, query.lon, query.ip)
	.then(channelsByIPCB)
	.catch(e => console.error("findChannelByIP", e));
};

const clientVerifier = function(info, cb){
	const {query} = URLParser(info.req.url, true);
	
	query.lat = parseFloat(query.lat);
	query.lon = parseFloat(query.lon);
	
	if(!query.pcid || !isValidCoordinates(query.lon, query.lat)){
		cb(false);
	}else{
		query.ip = getIPFromConnection(info.req);
		info.req["socketQuery"] = query;
		if(query.channel){
			pub.get(`channel_${query.channel}`, function(err, channel){
				if(err){
					cb(false);
					return;
				}
				
				if(channel == null){
					createChannel(query, new Map(), cb);
				}else{
					cb(true);
				}
			});
		}else{
			findChannel(query, cb);
		}
	}
};

const getServer = function(server, path = "/"){
	if(wss) throw new Error("WSS already created");
	
	const wssobject = {
		path: path,
		verifyClient: clientVerifier,
		clientTracking: true
	}
	
	if(server)
		wssobject.server = server;
	else
		wssobject.port = config.get("socketServer.port");
	
	wss = new Server(wssobject);
	return wss;
};

const eachClient = function(ws){
	if (ws.isAlive === false) return ws.terminate();
	ws.isAlive = false;
	ws.ping(noop);
};

const ping = function() {
	pub.set(`serverhb_${ServerName}`, Date.now());
	wss.clients.forEach(eachClient);
};

const start = function(){
	if(!wss) throw new Error("WSS hasn't been sent");
	wss.on("connection", onConnection);
	sub.on("message", onPMessage);
	pub.set(`serverhb_${ServerName}`, Date.now());
	sub.subscribe(`server_${ServerName}`, (err, count) => { if(err) console.error(err); });
	pingInterval = setInterval(ping, config.get("socketServer.heartbeatInterval"));
};

module.exports = {
	getServer,
	start,
	addEvent,
	removeEvent
};