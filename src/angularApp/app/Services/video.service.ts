import { Observable, Observer } from 'rxjs';
import { Injectable } from '@angular/core';
import { ImageCaptureShim } from '../../imageCaptureShim';
declare const MediaRecorder;
declare const AudioContext;
declare const ImageCapture;
declare const Worker : any;

@Injectable({
	providedIn: 'root'
})
export class VideoService {


	canRecordVideo : boolean = false;
	allowedToRecord : boolean = false;
	isCapturing : boolean = false;
	private _Stream;
	private _ImageCapture;
	
	private _VideoStreamObvs : Observer<any>[] = [];
	videoStream$ : Observable<any> = new Observable<any>( (observer : Observer<any>) => {
		this._VideoStreamObvs.push(observer);
		
		if(this._Stream != null) 
			observer.next(this._Stream);
		
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

	constructor(){
		if ((<any> navigator).mediaDevices === undefined) {
			(<any> navigator).mediaDevices = {};
		}
		
		if (!("getUserMedia" in navigator) || (<any> navigator).getUserMedia == undefined){
			if("webkitGetUserMedia" in navigator && (<any> navigator).webkitGetUserMedia != undefined)
				(<any> navigator).getUserMedia = (<any> navigator).webkitGetUserMedia;
			else if("mozGetUserMedia" in navigator && (<any> navigator).mozGetUserMedia != undefined)
				(<any> navigator).getUserMedia = (<any> navigator).mozGetUserMedia;
			else return;
		}
		
		this.canRecordVideo = true;
	}
	
	private _onError(e){
		this._VideoStreamObvs.forEach( obs =>{ obs.error(e); } );
		this._VideoStreamObvs = [];
		this._PhotoObservers.forEach( obs =>{ obs.error(e); } );
		this._PhotoObservers = [];
	}

	private _startCapturing(stream) : void{
		this._Stream = stream;
		this._ImageCapture = new ImageCaptureShim(stream.getTracks()[0]);
		this.isCapturing = true;
		this._VideoStreamObvs.forEach( obs =>{ obs.next(stream); } );
	}

	private _stopCapture(){
		this._Stream.getTracks().forEach(track => track.stop());
		this.isCapturing = false;
		this._ImageCapture = null;
		this._Stream = null;
	}
	
	setFilterClass(f : string){
		this._ImageCapture.canvas2dContext.filter = f;
	}
	
	stopCapturing() : void {
		this._stopCapture();
		this._VideoStreamObvs.forEach( obs =>{ obs.complete(); } );
		this._VideoStreamObvs = [];
		this._PhotoObservers.forEach( obs =>{ obs.complete(); } );
		this._PhotoObservers = [];
	}
	
	takePhoto(){
		this._ImageCapture.takePhoto()
		.then( (blob) => {
			this._PhotoObservers.forEach( obs =>{ obs.next(blob); } );
		}).catch( (e) => {
			this._stopCapture();
			this._onError(e);
		});
		
	}
	
	startCameraFeed$() : Observable<any> {
		if(this.isCapturing) return this.videoStream$;
		
		(<any>navigator.mediaDevices).getUserMedia({
			video: { 
				facingMode : "user",
				framerate : 15
			} 
		})
		.then(stream => {
			this.allowedToRecord = true;
			this._startCapturing(stream);
		})
		.catch( e => {
			this.allowedToRecord = false;
			this._onError(e);
		});
		return this.videoStream$;
	}
}