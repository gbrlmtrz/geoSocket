"use strict";
const { deserialize, serialize } = require('bson');
const { inflate, deflate } = require('pako');
//const ports = new Map();

//console.log(this);
let Socket;
const that = self;

//ToDo reconnect
const deflateData = function(arrayBufer){
	const uint8array = new Uint8Array(arrayBufer);
	const deflated = inflate(uint8array);
	postMessage({intent: "message", payload: deserialize(deflated)});
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

const onClose = function(){
	postMessage({intent : "close" });
};

const onOpen = function(){
	postMessage({intent : "open" });
};

const createSocket = function(url){
	Socket = new WebSocket(url);
	Socket.addEventListener("open", onOpen);
	Socket.addEventListener("close", onClose);
	Socket.addEventListener("error", onError);
	Socket.addEventListener("message", onSMessage);
};

const onMessage = function(e){
	switch(e.data.intent){
		case "connect":
			createSocket(e.data.url);
			break;
		case "send":
			const d = deflate(serialize(e.data.payload), {level: 9});
			Socket.send(d);
			break;
		case "close":
			Socket.close();
			break;
	}
};

that.addEventListener("message", onMessage);