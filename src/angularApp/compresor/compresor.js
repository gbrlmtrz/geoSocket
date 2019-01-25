const {Lzp3} = require('@faithlife/compressjs');
const {inflate, deflate} = require('pako');
const str2ab = require('string-to-arraybuffer');
const ab2str = require('arraybuffer-to-string');
const {arrayBufferToBlob} = require('blob-util');

const that = self;

const compress = function(blob){
	return new Promise( (resolve) => {		
		const fileReader = new FileReader();
		fileReader.onload  = function(event) {
			const arrayBuffer = event.target.result;
			const uint8Array  = new Uint8Array(arrayBuffer);
			//const compressed = Lzp3.compressFile(uint8Array, null, 9);
			const compressed = deflate(uint8Array, {level : 9});
			const com = ab2str(compressed, 'binary');
			resolve(com);
		};
		fileReader.readAsArrayBuffer(blob);
	});
};

const decompress = function(base64string){
	const rebuff = str2ab(base64string);
	const uint = new Uint8Array(rebuff);
	//const decompressed = Lzp3.decompressFile(uint);
	const decompressed = inflate(uint);
	return arrayBufferToBlob(decompressed);
};

const encode = function(blob){
	return new Promise((resolve) => {
		const reader = new FileReader();
		reader.onload = function() {
			resolve(reader.result);
		};
		reader.readAsDataURL(blob);
	});
};

const decode = function(base64string){
	const rebuff = str2ab(base64string);
	return arrayBufferToBlob(rebuff);
};

const _onMessage = function(e, postMessage){
	switch(e.data.intent){
		case "encode":
			encode(e.data.payload)
			.then((data) => {
				postMessage({intent: "encoded", payload: data, uuid: e.data.uuid});
			});
			break;
		case "decode":
			postMessage({intent: "decoded", payload: decode(e.data.payload), uuid: e.data.uuid});
			break;
		case "compress":
			compress(e.data.payload)
			.then((data) => {
				postMessage({intent: "compressed", payload: data, uuid: e.data.uuid});
			});
			break;
		case "decompress":
			postMessage({intent: "decompressed", payload: decompress(e.data.payload), uuid: e.data.uuid});
			break;
	}
};

const onMessage = function(e){
	_onMessage(e, that.postMessage);
};

const onConnection = function(con){
	const port = con.port[0];
	port.addEventListener('message', function(e) {
		_onMessage(e, port.postMessage);
	});
	port.start();
};


that.addEventListener("message", onMessage);
that.addEventListener("connection", onConnection);