"use strict";
const { deserialize, serialize } = require('bson');
const { inflate, deflate } = require('pako');
//const ports = new Map();

//console.log(this);
const that = self;
let Socket;
let tryReconnect = true;
let reconnectTimeout;
let URL;
let times = 0;
let channel;

const deflateData = function(arrayBufer){
	const uint8array = new Uint8Array(arrayBufer);
	const deflated = inflate(uint8array);
	const payload = deserialize(deflated);
	tryReconnect = payload.event != "terminated";
	if(payload.event == "channel"){
		channel = payload.payload.channel.id;
	}
	
	postMessage({intent: "message", payload: payload});
};

const onSMessage = function(d){
	if(d.data instanceof Blob){
		const reader = new FileReader();
		reader.addEventListener('loadend', (e) => {
			deflateData(reader.result);
		}, false)
		reader.readAsArrayBuffer(d.data)
	}else if(d.data instanceof ArrayBuffer){
		deflateData(d.data);
	}
};

const onError = function(){
	postMessage({intent : "error"});
};

const reconnectTimeoutFN = function(){
	createSocket(URL);
	reconnectTimeout = setTimeout(reconnectTimeoutFN, times * 5000);
};

const onClose = function(){
	postMessage({intent : "close" });
	if(tryReconnect){
		reconnectTimeout = setTimeout(reconnectTimeoutFN, times * 5000);
	}
};

const onOpen = function(){
	postMessage({intent : "open" });
	if(reconnectTimeout != null){
		clearTimeout(reconnectTimeout);
		times = 0;
	}
	Socket.addEventListener("close", onClose);
	Socket.addEventListener("error", onError);
	Socket.addEventListener("message", onSMessage);
};

const createSocket = function(url){
	URL = url;
	let conUrl = url;
	if(channel)
		conUrl = `${url}&channel=${channel}`;
	if(Socket)
		Socket.close();
	Socket = new WebSocket(conUrl);
	Socket.addEventListener("open", onOpen);
	times++;
};

const onMessage = function(e){
	switch(e.data.intent){
		case "connect":
			createSocket(e.data.url);
			break;
		case "send":
			const serialized = serialize(e.data.payload);
			const d = deflate(serialized, {level: 9});
			Socket.send(d);
			break;
		case "close":
			Socket.close();
			close();
			break;
	}
};

that.addEventListener("message", onMessage);