import { Observable, Observer } from 'rxjs';
import { Injectable } from '@angular/core';
import { Mp3Encoder } from 'lamejs';

declare const MediaRecorder;
declare const AudioContext;
declare const Worker : any;

@Injectable({
	providedIn: 'root'
})
export class AudioService { 

	canRecordAudio : boolean = false;
	allowedToRecord : boolean = false;
	isRecording : boolean = false;
	private _AudioWorker;
	private _useWorker : boolean = false;
	private _audioChunks = [];
	private _Stream;
	private _Context;
	private _sampleRate : number;
	private _Source;
	private _Node;
	private _numChannels : number = 2;
	private _buffers = [];
	private _recLength = 0;
	
	private _Observers : Observer<any>[] = [];
	
	audioOutput$ : Observable<any> = new Observable<any>( (observer : Observer<any>) => {
		this._Observers.push(observer);
		return {
			unsubscribe: () => {
				this._Observers.splice(this._Observers.indexOf(observer), 1);
			}
		};
	});

	constructor(){
		if ((<any> navigator).mediaDevices === undefined) {
			(<any> navigator).mediaDevices = {};
		}
		
		if(("Worker" in window) || (<any> window).Worker != undefined)
			this._useWorker = true;
		
		if (!("getUserMedia" in navigator) || (<any> navigator).getUserMedia == undefined){
			if("webkitGetUserMedia" in navigator && (<any> navigator).webkitGetUserMedia != undefined)
				(<any> navigator).getUserMedia = (<any> navigator).webkitGetUserMedia;
			else if("mozGetUserMedia" in navigator && (<any> navigator).mozGetUserMedia != undefined)
				(<any> navigator).getUserMedia = (<any> navigator).mozGetUserMedia;
			else return;
		}
		
		this.canRecordAudio = true;
	}
	
	private _postAudioOutput(data){
		this._Observers.forEach( obs =>{ obs.next(data); obs.complete(); } );
		this._Observers = [];
	}
	
	private _onAudioWorkerMessage(e){
		switch(e.data.intent){
			case "compiled":
				this._postAudioOutput(e.data.payload);
				break;
		}
	}
	
	private _onAudioError(e){
		console.log(e);
		this._Observers.forEach( obs =>{ obs.error(e); } );
		this._Observers = [];
	}

	private _onAudioProccess(e){
		if(this._useWorker){
			let buffers = [];
			for(let i = 0; i < this._numChannels; i++)
				buffers.push(e.inputBuffer.getChannelData(i));
			
			this._AudioWorker.postMessage({intent: "onaudioprocess", payload: buffers});
		}else{
			for(let i = 0; i < this._numChannels; i++)
				this._buffers[i].push(...e.inputBuffer.getChannelData(i));
			this._recLength += e.inputBuffer.getChannelData(0).length;
		}
	}
	
	private _spawnAudioWorker(){		
		this._AudioWorker = new Worker("/audioRecorder/dist/audioRecorder.js");
		this._AudioWorker.onerror = this._onAudioError.bind(this);
		this._AudioWorker.onmessage = this._onAudioWorkerMessage.bind(this);
	}
	
	private _startAudioRecording(stream) : void{
		if(this._useWorker)
			this._spawnAudioWorker();
		
		this._Stream = stream;
		this._Context = new AudioContext();
		
		this._sampleRate = this._Context.sampleRate;
		
		if(this._useWorker){
			this._AudioWorker.postMessage({intent: "config", payload: {
				sampleRate : this._Context.sampleRate,
				numChannels: this._numChannels
			}});
		}else{
			for(let i = 0; i < this._numChannels; i++){
				this._buffers[i] = [];
			}
		}
		
		this._Source = this._Context.createMediaStreamSource(stream);

		this._Node;

		if(!this._Context.createScriptProcessor){
		   this._Node = this._Context.createJavaScriptNode(0, this._numChannels, this._numChannels);
		} else {
		   this._Node = this._Context.createScriptProcessor(0, this._numChannels, this._numChannels);
		}

		this._Node.onaudioprocess = this._onAudioProccess.bind(this);

		this._Source.connect(this._Node);
		this._Node.connect(this._Context.destination);
	}
	
	private _floatTo16BitPCM(input, output) {
		for (let i = 0; i < input.length; i++) {
			const s = Math.max(-1, Math.min(1, input[i]));
			output[i] = (s < 0 ? s * 0x8000 : s * 0x7FFF);
		}
	}

	private _convertBuffer(buffer){
		const data = new Float32Array(buffer);
		const out = new Int16Array(buffer.length);
		this._floatTo16BitPCM(data, out);
		return out;
	};

	private _makeMP3(){
		const mp3Encoder = new Mp3Encoder(this._numChannels, this._sampleRate, 60);
		
		const mp3Data = [];
		const blockSize = 1152;
		const blocks = [];
		let mp3Buffer;
		let newBuffer = [];
		
		for(const buffer of this._buffers)
			newBuffer.push(this._convertBuffer(buffer));
		
		for (let i = 0; i < this._recLength; i += blockSize) {
			const channels = [];
			let lc, rc;
			if(this._numChannels == 1){
				lc = newBuffer[0].subarray(i, i + blockSize);
				mp3Buffer = mp3Encoder.encodeBuffer(lc);
			}else if(this._numChannels == 2){
				lc = newBuffer[0].subarray(i, i + blockSize);
				rc = newBuffer[1].subarray(i, i + blockSize);
				mp3Buffer = mp3Encoder.encodeBuffer(lc, rc);
			}
			
			if (mp3Buffer.length > 0) blocks.push(mp3Buffer);
		}
		mp3Buffer = mp3Encoder.flush();   
		if (mp3Buffer.length > 0) blocks.push(mp3Buffer);
		return new Blob(blocks, {type: 'audio/mpeg'});
	}

	stopAudioRecording() : void {
		this._Context.close();
		this._Source.disconnect();
		this._Node.disconnect();
		this._Stream.getTracks().forEach(track => track.stop());
		if(this._useWorker){
			this._AudioWorker.postMessage({intent: "stopStream"});	
		}else{
			this._postAudioOutput(this._makeMP3());
			this._recLength = 0;
			this._buffers = [];
		}
	}
	
	startAudioRecording$() : Observable<any> {
		if(this.isRecording) return this.audioOutput$;
		
		navigator.mediaDevices.getUserMedia({ audio: true })
		.then(stream => {
			this.allowedToRecord = true;
			this._startAudioRecording(stream);
		})
		.catch( e => {
			this.allowedToRecord = false;
			this._onAudioError(e);
		});
		return this.audioOutput$;
	}
	

}
