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
	private isOfferer : boolean = false;
	private _reNeg : boolean = false;
	LocalStream;
	Channel;
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
	
	remoteTrack;
	remoteStream;
	
	private remoteTrackObservers : Observer<any>[] = [];
	remoteTrack$  : Observable<any> = new Observable<any>( (observer : Observer<any>) => {
		this.remoteTrackObservers.push(observer);
		if(this.remoteTrack) observer.next(this.remoteTrack);
		
		return {
			unsubscribe: () => {
				this.remoteTrackObservers.splice(this.remoteTrackObservers.indexOf(observer), 1);
			}
		};
	});
	
	private remoteStreamObservers : Observer<any>[] = [];
	remoteStream$  : Observable<any> = new Observable<any>( (observer : Observer<any>) => {
		this.remoteTrackObservers.push(observer);
		if(this.remoteStream) observer.next(this.remoteStream);
		
		return {
			unsubscribe: () => {
				this.remoteStreamObservers.splice(this.remoteStreamObservers.indexOf(observer), 1);
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
	
	private _OfferObservers : Observer<any>[] = [];
	Offer$  : Observable<any> = new Observable<any>( (observer : Observer<any>) => {
		this._OfferObservers.push(observer);
		return {
			unsubscribe: () => {
				this._OfferObservers.splice(this._OfferObservers.indexOf(observer), 1);
			}
		};
	});
	
	private _AcceptObservers : Observer<any>[] = [];
	Accept$  : Observable<any> = new Observable<any>( (observer : Observer<any>) => {
		this._AcceptObservers.push(observer);
		return {
			unsubscribe: () => {
				this._AcceptObservers.splice(this._AcceptObservers.indexOf(observer), 1);
			}
		};
	});
	
	private _ChannelMessagesObservers : Observer<any>[] = [];
	channelMessages$  : Observable<any> = new Observable<any>( (observer : Observer<any>) => {
		this._ChannelMessagesObservers.push(observer);
		return {
			unsubscribe: () => {
				this._ChannelMessagesObservers.splice(this._ChannelMessagesObservers.indexOf(observer), 1);
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
		if(this._peerConnection != null)
			switch(this._peerConnection.iceConnectionState) {
				case "closed":
				case "failed":
				case "disconnected":
					//this.close();
					break;
			}
	}
	
	private _handleConnectionChangeEvent(event){
		if(this._peerConnection != null)
			switch (this._peerConnection.connectionState) {
				case "closed":
				case "failed":
				case "disconnected":
					this.close();
					break;
			}
	}
	
	private _handleSignalingStateChangeEvent(event){
		if(this._peerConnection != null){
			switch (this._peerConnection.signalingState) {
				case "stable":
					this._reNeg = false;
					break;
				case "closed":
					this.close();
					break;
				default:
					this._reNeg = true;
					break;
			}
		}
	}
	
	private _handleNegotiationNeededEvent(event){
		if(this._reNeg) return;
		this._reNeg = true;
		//ToDo something that works
		setTimeout(() => { this.createOffer() }, Math.floor(Math.random() * 2000));
	}
	
	private _onTrack(e){
		this.remoteTrackObservers.forEach( obs =>{ obs.next(e.streams); } );
	}
	
	private _onStream(stream){
		this.remoteStreamObservers.forEach( obs =>{ obs.next(stream); } );
	}
	
	connect(){
		if(this._peerConnection) return;
		this._peerConnection = new RTCPeerConnection(RTCPeerConConfig);
		this._peerConnection.onicecandidate = (e) => { this._handleICECandidateEvent.call(this, e); };
        this._peerConnection.oniceconnectionstatechange = (e) => { this._handleICEConnectionStateChangeEvent.call(this, e); };
        this._peerConnection.onsignalingstatechange = (e) => { this._handleSignalingStateChangeEvent.call(this, e); };
        this._peerConnection.onconnectionstatechange = (e) => { this._handleConnectionChangeEvent.call(this, e); };
        this._peerConnection.onnegotiationneeded  = (e) => { this._handleNegotiationNeededEvent.call(this, e); };
		this._peerConnection.ontrack = this._onTrack.bind(this);
		this._peerConnection.onaddstream = this._onStream.bind(this);
		this._setUpChannel(
			this._peerConnection.createDataChannel("channel", {negotiated: true, id: 1})
		);
		if(this.LocalStream){
			this._peerConnection.addStream(this.LocalStream);
		}
	}
	
	close(){
		this.busy = false;
		this.isOfferer = false;
		this._reNeg = false;
		if(this._peerConnection != null)
			this._peerConnection.close();
        this._peerConnection = null;
		this.Channel = null;
	}
	
	private _addTimeout;
	
	private _onChannelOpen(event){
		
	}
	
	private _onChannelMessage(event){
		const data = JSON.parse(event.data);
		this._ChannelMessagesObservers.forEach( obs => obs.next(data) );
	}
	
	private _setUpChannel(channel){
		this.Channel = channel;
		this.Channel.onopen = this._onChannelOpen.bind(this);
		this.Channel.onmessage = this._onChannelMessage.bind(this);
	}
	
	sendChannelMessage(data){
		this.Channel.send(JSON.stringify(data));
	}
	
	addLocalStream(stream){
		if(this._addTimeout) clearTimeout(this._addTimeout);
		this.LocalStream = stream;
		if(this._peerConnection){
			if(this._reNeg)
				this._addTimeout = setTimeout(() => { this.addLocalStream(stream); }, 1000)
			else{
				this._peerConnection.addStream(stream);
				this._addTimeout = null;
			}
		}
	}
	
	createOffer(){
		this.isOfferer = true;	
		if(!this._peerConnection) this.connect();
		
		this._peerConnection
		.createOffer()
		.then( (offer) => {
			return this._peerConnection.setLocalDescription(offer);
		})
		.then(() => {
			this.busy = true;
			this._OfferObservers.forEach( obs =>{ obs.next(this._peerConnection.localDescription); } );
		})
		.catch((e) => {
			console.log(e);
			//DoWhatsNecesary for a restart of the connection
		});
	}
	
	private _acceptOffer(sdp){
		if(!this._peerConnection) this.connect();
		this._peerConnection.setRemoteDescription(new RTCSessionDescription(sdp))
		.then(() => {
			return this._peerConnection.createAnswer()
		})
		.then((answer) => {
			return this._peerConnection.setLocalDescription(answer);
		})
		.then(() => {
			this.busy = true;
			this._AcceptObservers.forEach( obs =>{ obs.next(this._peerConnection.localDescription); } );
		})
		.catch((e) => {
			console.log(e);
			//DoWhatsNecesary for a restart of the connection
		});
	}
	
	private _offerAcepted(sdp){
		if(!this._peerConnection) return;
		this._peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
    }
	
	onSDP(sdp){ 
		const desc = new RTCSessionDescription(sdp);
		if (desc.type == "offer") {
			this._acceptOffer(sdp);
		}else{
			this._offerAcepted(sdp);
		}
	}
	
	newICECandidate(candidate){
		if(!this._peerConnection || this._reNeg) return;
		this._peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
	}

}