"use strict";
const {Mp3Encoder} = require('lamejs');

const floatTo16BitPCM = function(input, output, offset) {
	for (let i = 0; i < input.length; i++) {
		const s = Math.max(-1, Math.min(1, input[i]));
		output[i] = (s < 0 ? s * 0x8000 : s * 0x7FFF);
	}
}

const convertBuffer = function(buffer){
	const data = new Float32Array(buffer);
    const out = new Int16Array(buffer.length);
    floatTo16BitPCM(data, out);
    return out;
};

const makeMP3 = function(){
	const mp3Encoder = new Mp3Encoder(numChannels, sampleRate, 60);
	
	const mp3Data = [];
	const blockSize = 1152;
	const blocks = [];
	let mp3Buffer;
	let newBuffer = [];
	
	for(const buffer of recBuffers)
		newBuffer.push(convertBuffer(buffer));
	
	for (let i = 0; i < recLength; i += blockSize) {
		const channels = [];
		let lc, rc;
		if(numChannels == 1){
			lc = newBuffer[0].subarray(i, i + blockSize);
			mp3Buffer = mp3Encoder.encodeBuffer(lc);
		}else if(numChannels == 2){
			lc = newBuffer[0].subarray(i, i + blockSize);
			rc = newBuffer[1].subarray(i, i + blockSize);
			mp3Buffer = mp3Encoder.encodeBuffer(lc, rc);
		}
		
		if (mp3Buffer.length > 0) blocks.push(mp3Buffer);
	}
	mp3Buffer = mp3Encoder.flush();   
	if (mp3Buffer.length > 0) blocks.push(mp3Buffer);
	return new Blob(blocks, {type: 'audio/mpeg'});
};

let recLength = 0;
let recBuffers = [];

const onAudioProcess = function(e){
	for(let i = 0; i < numChannels; i++){
		recBuffers[i].push(...e[i]);
	}
	recLength += e[0].length;
};

const stopStream = function(){
	postMessage({intent: "compiled", payload: makeMP3()});
	recLength = 0;
	recBuffers = [];
	close();
}

let numChannels;
let sampleRate;

const onMessage = function(e){
	switch(e.data.intent){
		case "config":
			numChannels = e.data.payload.numChannels;
			sampleRate = e.data.payload.sampleRate;
			for(let i = 0; i < numChannels; i++){
				recBuffers[i] = [];
			}
			break;
		case "onaudioprocess":
			onAudioProcess(e.data.payload);
			break;
		case "stopStream":
			stopStream();
			break;
	}
};

self.addEventListener("message", onMessage);