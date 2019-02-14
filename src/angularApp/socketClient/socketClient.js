"use strict";
const { deserialize, serialize } = require('bson');
const { inflate, deflate } = require('pako');

const that = self;
let Socket;
let channel;

const deflateData = function(arrayBufer){
	const uint8array = new Uint8Array(arrayBufer);
	const deflated = inflate(uint8array);
	const payload = deserialize(deflated);
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

const onClose = function(){
	postMessage({intent : "close" });
	Socket.close();
	close();
};

const onOpen = function(){
	postMessage({intent : "open" });
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