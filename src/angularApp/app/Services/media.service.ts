import { Observable, Observer } from 'rxjs';
import { Injectable } from '@angular/core';
import { ImageCaptureShim } from '../../imageCaptureShim';
import { Mp3Encoder } from 'lamejs';

declare const MediaRecorder;
declare const AudioContext;
declare const ImageCapture;
declare const Worker : any;

@Injectable({
	providedIn: 'root'
})
export class MediaService {


	canRecordMedia : boolean = false;
	allowedToRecord : boolean = false;
	isCapturingImage : boolean = false;
	isCapturingVideo : boolean = false;
	isRecordingAudio : boolean = false;
	inUse : boolean = false;
	private _AudioWorker;
	private _useWorker : boolean = false;
	private _audioChunks = [];
	private _CameraStream;
	private _VideoStream;
	private _AudioStream;
	private _ImageCapture;
	private _Context;
	private _sampleRate : number;
	private _Source;
	private _Node;
	private _numChannels : number = 2;
	private _buffers = [];
	private _recLength = 0;
	
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
		
		this.canRecordMedia = true;
	}
		
	private _AudioObservers : Observer<any>[] = [];
	audioOutput$ : Observable<any> = new Observable<any>( (observer : Observer<any>) => {
		this._AudioObservers.push(observer);
		return {
			unsubscribe: () => {
				this._AudioObservers.splice(this._AudioObservers.indexOf(observer), 1);
			}
		};
	});
	
	private _CameraStreamObvs : Observer<any>[] = [];
	cameraStream$ : Observable<any> = new Observable<any>( (observer : Observer<any>) => {
		this._CameraStreamObvs.push(observer);
		
		if(this._CameraStream != null) 
			observer.next(this._CameraStream);
		
		return {
			unsubscribe: () => {
				this._CameraStreamObvs.splice(this._CameraStreamObvs.indexOf(observer), 1);
			}
		};
	});
	
	private _VideoStreamObvs : Observer<any>[] = [];
	videoStream$ : Observable<any> = new Observable<any>( (observer : Observer<any>) => {
		this._VideoStreamObvs.push(observer);
		
		if(this._VideoStream != null) 
			observer.next(this._VideoStream);
		
		return {
			unsubscribe: () => {
				this._VideoStreamObvs.splice(this._VideoStreamObvs.indexOf(observer), 1);
			}
		};
	});
	
	private _PhotoObservers : Observer<any>[] = [];
	photosOutput$ : Observable<any> = new Observable<any>( (observer : Observer<any>) => {
		this._PhotoObservers.push(observer);
		return {
			unsubscribe: () => {
				this._PhotoObservers.splice(this._PhotoObservers.indexOf(observer), 1);
			}
		};
	});

	private _onCameraError(e){
		this.inUse = false;
		this._CameraStreamObvs.forEach( obs =>{ obs.error(e); } );
		this._CameraStreamObvs = [];
		this._PhotoObservers.forEach( obs =>{ obs.error(e); } );
		this._PhotoObservers = [];
	}

	private _startCameraFeed(stream) : void{
		this.inUse = true;
		this._CameraStream = stream;
		this._ImageCapture = new ImageCaptureShim(stream.getTracks()[0]);
		this.isCapturingImage = true;
		this._CameraStreamObvs.forEach( obs =>{ obs.next(stream); } );
	}

	private _stopCameraFeed(){
		this.inUse = false;
		this._CameraStream.getTracks().forEach(track => track.stop());
		this.isCapturingImage = false;
		this._ImageCapture = null;
		this._CameraStream = null;
	}
	
	setFilterClass(f : string){
		this._ImageCapture.canvas2dContext.filter = f;
	}
	
	stopCameraFeed() : void {
		this._stopCameraFeed();
		this._CameraStreamObvs.forEach( obs =>{ obs.complete(); } );
		this._CameraStreamObvs = [];
		this._PhotoObservers.forEach( obs =>{ obs.complete(); } );
		this._PhotoObservers = [];
	}
	
	takePhoto(){
		this._ImageCapture.takePhoto()
		.then( (blob) => {
			this._PhotoObservers.forEach( obs =>{ obs.next(blob); } );
		}).catch( (e) => {
			this._stopCameraFeed();
			this._onCameraError(e);
		});
		
	}
	
	startCameraFeed$() : Observable<any> {
		if(this.isCapturingImage) return this.cameraStream$;
		
		(<any> navigator.mediaDevices).getUserMedia({
			video: { 
				facingMode : "user",
				framerate : 15
			} 
		})
		.then(stream => {
			this.allowedToRecord = true;
			this._startCameraFeed(stream);
		})
		.catch( e => {
			this.allowedToRecord = false;
			this._onCameraError(e);
		});
		return this.cameraStream$;
	}
	
	
	private _onVideoError(e){
		this.inUse = false;
		this._VideoStreamObvs.forEach( obs =>{ obs.error(e); } );
		this._CameraStreamObvs = [];
	}

	private _startVideoFeed(stream) : void{
		this.inUse = true;
		this._VideoStream = stream;
		this.isCapturingVideo = true;
		this._VideoStreamObvs.forEach( obs =>{ obs.next(stream); } );
	}

	private _stopVideoFeed(){
		this.inUse = false;
		this._VideoStream.getTracks().forEach(track => track.stop());
		this.isCapturingVideo = false;
		this._VideoStream = null;
	}
	
	stopVideoFeed() : void {
		this._stopVideoFeed();
		this._VideoStreamObvs.forEach( obs =>{ obs.complete(); } );
		this._VideoStreamObvs = [];
	}
	
	startVideoFeed$() : Observable<any> {
		if(this.isCapturingImage) return this.videoStream$;
		
		(<any> navigator.mediaDevices).getUserMedia({
			video: { 
				facingMode : "user",
				aspectRatio: 1.77,
				framerate : {
					max : 24
				},
				height: {
					max : 480,
					min : 270
				},
				width: {
					max : 480,
					min : 270
				},
				resizeMode : "crop-and-scale"
			},
			audio : {
			  sampleSize: 8,
			  sampleRate: 24000,
			  channelCount : 1,
			  noiseSuppression : true,
			  echoCancellation: true
			}
		})
		.then(stream => {
			this.allowedToRecord = true;
			this._startVideoFeed(stream);
		})
		.catch( e => {
			this.allowedToRecord = false;
			this._onVideoError(e);
		});
		return this.videoStream$;
	}
	
	
	
	private _postAudioOutput(data){
		this._AudioObservers.forEach( obs =>{ obs.next(data); obs.complete(); } );
		this._AudioObservers = [];
	}
	
	private _onAudioWorkerMessage(e){
		switch(e.data.intent){
			case "compiled":
				this._postAudioOutput(e.data.payload);
				break;
		}
	}
	
	private _onAudioError(e){
		this.inUse = false;
		this._AudioObservers.forEach( obs =>{ obs.error(e); } );
		this._AudioObservers = [];
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
		
		this._AudioStream = stream;
		this.inUse = true;
		this.isRecordingAudio = true;
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
		if(!this.isRecordingAudio) return;
		this._Context.close();
		this._Source.disconnect();
		this._Node.disconnect();
		this.isRecordingAudio = false;
		this.inUse = false;
		this._AudioStream.getTracks().forEach(track => track.stop());
		if(this._useWorker){
			this._AudioWorker.postMessage({intent: "stopStream"});	
		}else{
			this._postAudioOutput(this._makeMP3());
			this._recLength = 0;
			this._buffers = [];
		}
	}
	
	startAudioRecording$() : Observable<any> {
		if(this.isRecordingAudio) return this.audioOutput$;
		
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