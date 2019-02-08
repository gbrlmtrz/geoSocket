import { Observable, Observer } from 'rxjs';
import { Injectable } from '@angular/core';

const GetRTCIceCandidate = function(){
	(<any> window).RTCIceCandidate =
		(<any> window).RTCIceCandidate ||
		(<any> window).webkitRTCIceCandidate ||
		(<any> window).mozRTCIceCandidate ||
		(<any> window).msRTCIceCandidate || 
		false;
	return (<any> window).RTCIceCandidate;
};

const GetRTCPeerConnection = function(){
	(<any> window).RTCPeerConnection =
		(<any> window).RTCPeerConnection ||
		(<any> window).webkitRTCPeerConnection ||
		(<any> window).mozRTCPeerConnection ||
		(<any> window).msRTCPeerConnection || 
		false;
	return (<any> window).RTCPeerConnection;
};

const GetRTCSessionDescription = function(){
	(<any> window).RTCSessionDescription = (<any> window).RTCSessionDescription || 
		(<any> window).webkitRTCSessionDescription ||
		(<any> window).mozRTCSessionDescription ||
		(<any> window).msRTCSessionDescription || 
		false;
  return (<any> window).RTCSessionDescription;
};

const RTCPeerConConfig = {
	iceServers : [
		{
			urls: 'stun:stun.l.google.com:19302'
		},
		{
			urls: 'turn:numb.viagenie.ca',
			credential: 'muazkh',
			username: 'webrtc@live.com'
		}
	]
};

declare const RTCPeerConnection : any;
declare const RTCIceCandidate : any;
declare const RTCSessionDescription : any;

@Injectable({
	providedIn: 'root'
})
export class RTCService {
	
	isSupported : boolean = false;
	busy : boolean = false;
	private _LocalStream;
	private _peerConnection;
	private _ICEConfig = [
		{
			urls: 'stun.l.google.com:19302'
		},
		{
			urls: 'turn:numb.viagenie.ca',
			credential: 'muazkh',
			username: 'webrtc@live.com'
		}
	];
	
	private _remoteTrack;
	private _remoteStream;
	
	private _remoteTrackObservers : Observer<any>[] = [];
	remoteTrack$  : Observable<any> = new Observable<any>( (observer : Observer<any>) => {
		this._remoteTrackObservers.push(observer);
		if(this._remoteTrack) observer.next(this._remoteTrack);
		
		return {
			unsubscribe: () => {
				this._remoteTrackObservers.splice(this._remoteTrackObservers.indexOf(observer), 1);
			}
		};
	});
	
	private _remoteStreamObservers : Observer<any>[] = [];
	remoteStream$  : Observable<any> = new Observable<any>( (observer : Observer<any>) => {
		this._remoteTrackObservers.push(observer);
		if(this._remoteStream) observer.next(this._remoteStream);
		
		return {
			unsubscribe: () => {
				this._remoteStreamObservers.splice(this._remoteStreamObservers.indexOf(observer), 1);
			}
		};
	});
	
	private _ICEObservers : Observer<any>[] = [];
	ICE$  : Observable<any> = new Observable<any>( (observer : Observer<any>) => {
		this._ICEObservers.push(observer);
		return {
			unsubscribe: () => {
				this._ICEObservers.splice(this._ICEObservers.indexOf(observer), 1);
			}
		};
	});
	
	constructor(){
		if(!GetRTCIceCandidate() || !GetRTCPeerConnection() || !GetRTCSessionDescription())
			return;
		this.isSupported = true;
	}
	
	private _handleICECandidateEvent(event){
		if(event.candidate)
			this._ICEObservers.forEach( obs =>{ obs.next(event.candidate); } );
	}
	
	private _handleICEConnectionStateChangeEvent(event){
		console.log("this", this);
		switch(this._peerConnection.iceConnectionState) {
            case "closed":
            case "failed":
            case "disconnected":
                this.close();
        }
	}
	
	private _handleSignalingStateChangeEvent(event){
		switch (this._peerConnection.signalingState) {
            case "closed":
                this.close();
        }
	}
	
	private _onTrack(e){
		this._remoteTrackObservers.forEach( obs =>{ obs.next(e.streams); } );
	}
	
	private _onStream(stream){
		this._remoteStreamObservers.forEach( obs =>{ obs.next(stream); } );
	}
	
	connect(){
		if(this._peerConnection) return;
		this._peerConnection = new RTCPeerConnection(RTCPeerConConfig);
		this._peerConnection.onicecandidate = (e) => { this._handleICECandidateEvent.call(this, e); };
        this._peerConnection.oniceconnectionstatechange = (e) => { this._handleICEConnectionStateChangeEvent.call(this, e); };
        this._peerConnection.onsignalingstatechange = (e) => { this._handleSignalingStateChangeEvent.call(this, e); };
		this._peerConnection.ontrack = this._onTrack.bind(this);
		this._peerConnection.onaddstream = this._onStream.bind(this);
		if(this._LocalStream){
			this._peerConnection.addStream(this._LocalStream);
		}
	}
	
	close(){
		this.busy = false;
        this._peerConnection.close();
        this._peerConnection = null;
	}
	
	addLocalStream(stream){
		this._LocalStream = stream;
		if(this._peerConnection)
			this._peerConnection.addStream(stream);
	}
	
	createOffer() : Promise<any>{
		if(this.busy) return;
		return new Promise( (resolve, reject) => {			
			this._peerConnection
			.createOffer()
			.then(offer => {
				return this._peerConnection.setLocalDescription(offer);
			})
			.then(() => {
				this.busy = true;
				resolve(this._peerConnection.localDescription);
			})
			.catch(reject);
		});
	}
	
	acceptOffer(sdp) : Promise<any>{
		if(this.busy) return;
		if(!this._peerConnection) this.connect();
		return new Promise( (resolve, reject) => {			
			this._peerConnection
				.setRemoteDescription(new RTCSessionDescription(sdp))
				.then(() => this._peerConnection.createAnswer())
				.then(answer => {
					return this._peerConnection.setLocalDescription(answer);
				})
				.then(() => {
					this.busy = true;
					resolve(this._peerConnection.localDescription);
				})
				.catch((e) => { console.error(e); reject(e);} );
		});
	}
	
	offerAcepted(sdp){
		if(!this._peerConnection) return;
		console.log("offerAcepted", sdp);
		this._peerConnection
			.setRemoteDescription(new RTCSessionDescription(sdp))
			.then(function(){
				console.log("args", arguments);
			})
			.catch((err) => {console.error(err)});
    }
	
	newICECandidate(candidate){
		if(!this._peerConnection) return;
		this._peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
	}

}