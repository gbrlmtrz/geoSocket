import { isDevMode } from '@angular/core';
import { Component, OnInit, ViewChild, HostListener } from '@angular/core';
import { MatDialog } from '@angular/material';
import { sprintf } from 'sprintf-js';
import { ActivatedRoute } from '@angular/router';
import { LangService } from '@Services/lang.service';
import { MediaService } from '@Services/media.service';
import { RTCService } from '@Services/rtc.service';
import { ConfigService } from '@Services/config.service';
import { CompresorService } from '@Services/compresor.service';
import { IdentityService } from '@Services/identity.service';
import { GeoLocationService } from '@Services/geolocation.service';
import { NotificationService } from '@Services/notification.service';
import { VisibilityService } from '@Services/visibility.service';
import { WebsocketService } from '@Services/websocket.service';
import { DomSanitizer } from '@angular/platform-browser';
import GeoPos from '@Interfaces/GeoPos';
import { Photo } from '@Interfaces/Photo';
import { Subscription } from 'rxjs';
import ConnectionPayload from '@Interfaces/ConnectionPayload';
import { default as MessageEvent, MessagePayload, Message } from '@Interfaces/Events/MessageEvent';
import { NamePickerDialog } from '@Components/Dialogs/NamePickerDialog';
import { ConnectingDialog } from '@Components/Dialogs/ConnectingDialog';
import { ReconnectDialog } from '@Components/Dialogs/ReconnectDialog';
import { CallDialog } from '@Components/Dialogs/CallDialog';
import { DialDialog } from '@Components/Dialogs/DialDialog';
import { PhotoBoot } from '@Components/Dialogs/PhotoBoot';
import { default as PresentationEvent, Presentation} from '@Interfaces/Events/PresentationEvent';
import deepEqual from 'deep-equal';
import ChannelI from '@Interfaces/Channel';
import nanoid from 'nanoid';

declare const URL;

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.css']
})
export class AppComponent {
	
	messagePayload : MessagePayload = {};
	
	Users : Map<string, Presentation> = new Map();
	Channel : ChannelI = {};
	
	resizeTimeout;
	User : Presentation;
	isLandscape : boolean = true;
	width : string;
	private _myID : string;
	nudging : boolean = false;
	private _nudgeTimeout;
	
	get isPortrait() : boolean{
		return !this.isLandscape;
	}
	
	/*@HostListener('window:resize')
    onWindowResize() {
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
        this.resizeTimeout = setTimeout(this._checkIfLandscape.bind(this), 500);
    }*/
	
	myFeed: MediaStream;
	theirFeed: MediaStream;
	
	posSubscription;
	pictures : string[] = [];
	
	private _geoSub;
	private _geoSubscription = {
		next : (geoPos : GeoPos) => {
			const ev = {event: "geoupdate", payload: {geoPos}};
			this._Websocket.sendMessage(ev);
		},
		error : e => {
			
		},
		complete : () => {
			
		}
	};
	
	private _connectingDialogRef;
	private _openConnectingDialog(){
		if(this._connectingDialogRef == null)
		this._connectingDialogRef = this._Dialog.open(ConnectingDialog, {
			disableClose: true
		});
	}
	
	private _reconnectDialogRef;
	private _openReconnectDialog(reason : string = ""){
		if(this._reconnectDialogRef != null) return;
		this._reconnectDialogRef = this._Dialog.open(ReconnectDialog, {disableClose: true, data: {reason}});
		this._reconnectDialogRef.afterClosed()
		.subscribe( () => {
			this._reconnectDialogRef = null;
			this._beginConnection();
		});
	}
	
	isOnline : boolean;
	private _socketOnlineSubscriber = {
		next : (online : boolean) => {
			if(this.isOnline === online) return;
			
			this.isOnline = online;
			if(online){
				if(this._connectingDialogRef){
					this._connectingDialogRef.close();
					this._connectingDialogRef = null;
				}
				this._sendPresentation();
				this._geoSub = this._GeoLocation.positions$.subscribe(this._geoSubscription);
			}else{
				this.Users.clear();
				this._MessageDictionary.clear();
				this.Messages = [];
				this.messagePayload = {};
				this.Channel = {};
				this.PhotoPreview = null;
				this.Quote = null;
				this.audioBlobURL = null;
				this._openReconnectDialog();
				if(this._geoSub){
					this._geoSub.unsubscribe();
					this._geoSub = null;
				}
			}
		},
		error : e => {
			
		},
		complete : () => {
			
		}
	};
	
	private _Anonymous : Presentation = {name: "Anonymous", color: "9e9e9e", picture: "000"};
	
	private _MessageDictionary : Map<string, Message> = new Map();
	Messages : Message[] = [];
	Quote : Message;
	
	private inCallWith : Presentation;
	private _RTCICESubscriber = {
		next : (ice) => {
			if(this.inCallWith == null) return;
			
			this._Websocket.sendMessage(
			{
				event: "ice", 
				payload: { 
					ice : { 
						candidate : ice.candidate,
						sdpMid : ice.sdpMid,
						sdpMLineIndex: ice.sdpMLineIndex
					}, 
					to : this.inCallWith.id 
				}
			});
		}
	};
	
	private _RTCOfferSubscriber = {
		next : (sdp) => {
			if(this.inCallWith == null) return;
			
			this._Websocket.sendMessage({
				event: "rtcoffer", 
				payload: { 
					sdp : { sdp : sdp.sdp, type : sdp.type }, 
					to : this.inCallWith.id
				}
			});
		}
	};
	
	private _RTCAcceptSubscriber = {
		next : (sdp) => {
			this._Websocket.sendMessage({
				event: "rtcaccept", 
				payload: { 
					sdp : { 
						sdp : sdp.sdp, 
						type : sdp.type
					}, 
					to : this.inCallWith.id
				}
			});
		}
	};
	
	private _messagesSubscriber = {
		next : data => {
			switch(data.event){
				case "channelSwitch":
					this.Users.clear();
					this._MessageDictionary.clear();
					this.Messages = [];
					this.messagePayload = {};
					this.Quote = null;
					this.Notification.sendNotification(`channelSwitch_${data.sender}`, {
						title : this.Lang.lang.NotificationTitles.nudge,
						body : sprintf(this.Lang.lang.NotificationBodies.nudge, this.Users.get(data.sender).name),
						icon : `${this._Config.URL}assets/avatars/${this.Users.get(data.sender).picture}.svg`,
						isToast : true,
						isNotification : true
					});
					break;
				case "terminated":
					this._openReconnectDialog(this.Lang.lang.DisconnectReasons.openedInAnotherTab);
					break;
				case "nudge":
					if(this._nudgeTimeout)
						clearTimeout(this._nudgeTimeout);
					this.nudging = true;
					
					this.Users.get(data.sender).nudging = true;
					setTimeout(() => {
						this.Users.get(data.sender).nudging = false;
					}, 2000);
					
					this._nudgeTimeout = setTimeout( () => {
						this.nudging = false;
					} , 2000);
					
					this.Notification.sendNotification(`nudge_${data.sender}`, {
						title : this.Lang.lang.NotificationTitles.nudge,
						body : sprintf(this.Lang.lang.NotificationBodies.nudge, this.Users.get(data.sender).name),
						icon : `${this._Config.URL}assets/avatars/${this.Users.get(data.sender).picture}.svg`,
						isToast : true,
						isNotification : true
					});
					break;
				case "message":
					if(data.sender != this._myID){
						
						let title, body;
						if(data.payload.message){
							title = sprintf(this.Lang.lang.NotificationTitles.message, this.Users.get(data.sender).name);
							body = data.payload.message;
						}else{
							title = sprintf(this.Lang.lang.NotificationTitles.voiceNote, this.Users.get(data.sender).name);
							body = sprintf(this.Lang.lang.NotificationBodies.voiceNote, this.Users.get(data.sender).name);
						}
						
						this.Notification.sendNotification(`message_${data.sender}`, {
							title,
							body,
							icon : `${this._Config.URL}assets/avatars/${this.Users.get(data.sender).picture}.svg`,
							isToast : false,
							isNotification : true
						});
						
						this._addMessage(data.payload, data.sender);
					}else if(this._MessageDictionary.has(data.payload.id)){
						this._MessageDictionary.get(data.payload.id).recieved = true;
					}
					break;
				case "yourID":
					this._myID = data.payload.id;
					if(this.Users.has(this._myID))
						this.Users.delete(this._myID);
					break;
				case "channel":
					this.Channel = data.payload.channel;
					for(const client of this.Channel.clients){
						if(this._myID != client)
							this.Users.set(client, {id: client, ...this._Anonymous});
					}
					
					for(const presentation of this.Channel.presentation){
						if(this._myID != presentation.id){
							this.Users.set(presentation.id, {...presentation});
						}
					}
					break;
				case "disconnect":
					this.Notification.sendNotification(`disconnect_${data.sender}`, {
						title : this.Lang.lang.NotificationTitles.disconnected,
						body : sprintf(this.Lang.lang.NotificationBodies.disconnected, this.Users.get(data.payload.peer).name),
						icon : `${this._Config.URL}assets/avatars/${this.Users.get(data.payload.peer).picture}.svg`,
						isToast : true,
						isNotification : true
					});
					
					if(this.inCallWith != null && data.payload.peer == this.inCallWith.id){
						this._closeCallDialog(this.Lang.lang.call.disconnected);
						this._closeCallRequestDialog(this.Lang.lang.call.disconnected);
						this._closePickUpDialog(this.Lang.lang.call.disconnected);
					}
					
					if(this.Users.has(data.payload.peer))
						this.Users.delete(data.payload.peer);
					break;
				case "newPeer":
					this.Users.set(data.payload.id, {id: data.payload.id, ...this._Anonymous});
					break;
				case "presentation":
					if(this.Users.has(data.sender)){
						this.Notification.sendNotification(`presentation_${data.sender}`, {
							title : this.Lang.lang.NotificationTitles.nameChange,
							body : sprintf(this.Lang.lang.NotificationBodies.nameChange, this.Users.get(data.sender).name, data.payload.name),
							icon : `${this._Config.URL}assets/avatars/${this.Users.get(data.sender).picture}.svg`,
							isToast : true,
							isNotification : true
						});
					}else{
						this.Notification.sendNotification(`presentation_${data.sender}`, {
							title : this.Lang.lang.NotificationTitles.newUser,
							body : sprintf(this.Lang.lang.NotificationBodies.newUser, data.payload.name),
							icon : `${this._Config.URL}assets/avatars/${this.Users.get(data.sender).picture}.svg`,
							isToast : true,
							isNotification : true
						});
					}
					
					this.Users.set(data.sender, {id: data.sender, ...data.payload});
					break;
				case "incall":
					if(this.Users.has(data.sender))
						this.Users.get(data.sender).onCall = data.payload.incall;
					break;
				case "istyping":
					if(this.Users.has(data.sender))
						this.Users.get(data.sender).typing = data.payload.istyping;
					break;
				case "hangup":
					if(this.inCallWith == null || data.sender != this.inCallWith.id) 
						return;
					this._closeCallDialog(this.Lang.lang.call[data.payload.reason]);
					break;
				case "callrequest":
					if(this.inCallWith != null) 
						return;
					
					this.Notification.sendNotification(`call_${data.sender}`, {
						title : this.Lang.lang.NotificationTitles.newCall,
						body : sprintf(this.Lang.lang.NotificationBodies.newCall, this.Users.get(data.sender).name),
						icon : `${this._Config.URL}assets/avatars/${this.Users.get(data.sender).picture}.svg`,
						isToast : false,
						isNotification : true
					});
					
					this._openPickUpDialog(this.Users.get(data.sender));
					break;
				case "requestcancelled":
					if(this.inCallWith == null || data.sender != this.inCallWith.id) 
						return;
					
					this._closePickUpDialog(this.Lang.lang.call.canceled);
					break;
				case "callrejected":
					if(this.inCallWith == null || data.sender != this.inCallWith.id) 
						return;
					
					this._closeCallRequestDialog(this.Lang.lang.call.rejected);
					break;
				case "callaccepted":
					if(this.inCallWith == null || this.inCallWith.id != data.sender) 
						return;
					
					this._dialDialogRef.close();
					this.Media.startVideoFeed$().subscribe({
						next : (stream) => {
							//this._RTC.connect();
							this._RTC.createOffer();
							this._RTC.addLocalStream(stream);
						},
						error : () => {							
							this._Websocket.sendMessage({
								event : "hangup",
								payload : {
									to : this.inCallWith.id,
									reason : "technicalProblems"
								}
							});
							this._closeCallDialog();
						}
					});
					this._openCallDialog();
					break;
				case "ice":
					if(this.inCallWith == null || data.sender != this.inCallWith.id) 
						return;
					
					this._RTC.newICECandidate(data.payload.ice);
					break;
				case "rtcoffer":
				case "rtcaccept":
					if(this.inCallWith == null || data.sender != this.inCallWith.id) 
						return;
					
					this._RTC.onSDP(data.payload.sdp);
					break;
			}
		},
		error: e => {
			
		},
		complete: () => {
			
		}
	};
	
	constructor(
		private _activeRoute: ActivatedRoute,
		private _Config : ConfigService, 
		private _Sanitizer : DomSanitizer, 
		public Lang : LangService, 
		private _Dialog: MatDialog,
		private _RTC : RTCService, 
		public Media : MediaService, 
		private _Compresor : CompresorService, 
		public Notification : NotificationService, 
		private _Websocket : WebsocketService, 
		private _Visibility : VisibilityService, 
		private _Identity : IdentityService, 
		private _GeoLocation : GeoLocationService
	) {
	}
	
	sanitize( url : string){
		return this._Sanitizer.bypassSecurityTrustUrl(url);
	}
	
	toggleNotifications() : void{
		if(this.Notification.enabled){
			if(this.Notification.isGranted){
				this.Notification.startWork();
			}else{
				this.Notification.requestPermission();
			}
		}else{
			this.Notification.stopWork();
		}
	}
	
	private _callDialogRef;
	private _openCallDialog(){		
		this._callDialogRef = this._Dialog.open(CallDialog, {
			data: this.inCallWith,
			disableClose: true
		});
		this._callDialogRef.afterClosed()
		.subscribe( (result : boolean) => {
			if(result){
				this._Websocket.sendMessage({
					event : "hangup",
					payload : {
						to : this.inCallWith.id,
						reason : "hungup"
					}
				});
			}
			this._Websocket.sendMessage({
				event : "incall",
				payload : {
					incall : false
				}
			});
			this.Media.stopVideoFeed();
			this._RTC.close();
			this.inCallWith = null;
			this._callDialogRef = null;
		});
	}
	
	private _closeCallDialog(reason? : string){
		if(this._callDialogRef == null) return;
		
		if(reason)
			this.Notification.sendNotification(`callcanceled_${this.inCallWith.id}`, {
				title : this.Lang.lang.NotificationTitles.peerHasHungUp,
				body : sprintf(reason, this.inCallWith.name),
				icon : `${this._Config.URL}assets/avatars/${this.inCallWith.picture}.svg`,
				isToast : true,
				isNotification : true
			});
			
		this._callDialogRef.close();
	}
	
	ngOnInit() {
		this._checkIfLandscape();
		this.User = this._Identity.getUser();
		if(this.User.name != null){
			this._beginConnection();
		}else{
			setTimeout(() => {
				this.openNamePickerDialog();
			});
		}
		
		//this.inCallWith = this._Anonymous;
		//this._openCallDialog();
		
		this._Websocket.messages$.subscribe(this._messagesSubscriber);
		this._RTC.ICE$.subscribe(this._RTCICESubscriber);
		this._RTC.Offer$.subscribe(this._RTCOfferSubscriber);
		this._RTC.Accept$.subscribe(this._RTCAcceptSubscriber);
		
		if(this.Notification.isGranted && this.Notification.enabled){
			this.Notification.startWork();
		}
		
		this._Visibility.visibility$.subscribe({
			next : (visible : boolean ) => {
				this.isItVisible = visible;
			}
		});
	}
	
	isItVisible : boolean = true;
	
	quoting(quote : Message){
		this.Quote = quote;
	}
	
	private _addMessage(message : MessagePayload, by : string) : void{
		const mes : Message = {
			id : message.id,
			date : message.date,
			byMe : by == this._myID,
			recieved : false
		};
		
		if(this.Messages.length == 0)
			mes.firstOf = true;
		else{
			mes.firstOf = this.Messages[0].sender.id != by;
		}
		
		if(message.message)
			mes.message = message.message;
		
		if(message.quote && this._MessageDictionary.has(message.quote))
			mes.quote = this._MessageDictionary.get(message.quote);
		
		if(message.media){
			if(Array.isArray(message.media)){
				this._Compresor.decompress(message.media)
				.then( (newBlob) => {
					mes.media = this.sanitize(URL.createObjectURL(newBlob));
				});
			}else if(message.media instanceof Blob){
				mes.media = this.sanitize(URL.createObjectURL(message.media));
			}
		}
		
		if(message.photo){
			mes.photo = {filter : message.photo.filter};
			if(message.photo.url){
				mes.photo.url = message.photo.url;
			}else if(Array.isArray(message.photo.blob)){
				this._Compresor.decompress(message.photo.blob)
				.then( (newBlob) => {
					mes.photo.url = this.sanitize(URL.createObjectURL(newBlob));
				});
			}else if(message.photo.blob instanceof Blob){
				mes.photo.url = this.sanitize(URL.createObjectURL(message.photo.blob));
			}
		}
		
		if(mes.byMe){
			mes.sender = {...this.User, id: this._myID};
		}else{
			if(this.Users.has(by))
				mes.sender = this.Users.get(by);
			else
				mes.sender = this._Anonymous;
		}
		
		this._MessageDictionary.set(mes.id, mes);
		
		this.Messages.unshift(mes);
		if(this.Messages.length >= 100){
			this.Messages.pop();
		}
	};
	
	sendMessage(){
		if( !this._Websocket.online || 
			( 
				(!this.messagePayload.message || this.messagePayload.message.length == 0) &&
				!this.messagePayload.media &&
				!this.PhotoPreview
			)
		) return;
		this.messagePayload.id = nanoid();
		if(this.Quote)
			this.messagePayload.quote = this.Quote.id;
		
		this.Quote = null;
		const ev : MessageEvent = {event: "message", payload: this.messagePayload};
		
		ev.payload.date = Date.now();
		
		if(this.PhotoPreview){
			ev.payload.photo = this.PhotoPreview;
			this.PhotoPreview = null;
		}
		
		this._addMessage(ev.payload, this._myID);
		if(ev.payload.media || ev.payload.photo){
			
			const promises = [];
			
			if(ev.payload.media)
				promises.push(this._Compresor.compress(ev.payload.media));
			
			if(ev.payload.photo)
				promises.push(this._Compresor.compress(ev.payload.photo.blob));
			
			Promise.all(promises)
			.then((results) => {
				
				if(ev.payload.media)
					ev.payload.media = results.shift();
				
				if(ev.payload.photo)
					ev.payload.photo.blob = results.shift();
				
				this._Websocket.sendMessage(ev);
			})
			.catch(console.error);
		}else{
			this._Websocket.sendMessage(ev);
		}
		this.messagePayload = {};
		this.audioBlobURL = null;
	}
	
	exit(){
		this._Websocket.disconnect();
		this._GeoLocation.close();
		this._Identity.clear();
		this.User = {name : null, picture: "001"};
		this.openNamePickerDialog();
	}
	
	openNamePickerDialog(){		
		const dialogRef = this._Dialog.open(NamePickerDialog, {
			data: {user: {...this.User}, showCancel : this.User.name != null},
			disableClose: this.User.name == null,
			id: "NamePickerDialog"
		});
		dialogRef.afterClosed().subscribe( (result : Presentation) => {
			if(result != undefined && !deepEqual(result, this.User)){
				this.User = result;
				this._Identity.saveUser(this.User);
				if(this._Websocket.online)
					this._sendPresentation();
				else
					this._beginConnection();
			}
		});
	}
	
	private _dialDialogRef;
	sendCall(user : Presentation){
		if(this._dialDialogRef != null) return;
		this.inCallWith = user;
		
		
		this._Websocket.sendMessage({
			event : "incall",
			payload : {
				incall : true
			}
		});
		this._Websocket.sendMessage({
			event : "callrequest",
			payload : {
				to : this.inCallWith.id
			}
		});
		this._dialDialogRef = this._Dialog.open(DialDialog, {
			data: {user: this.inCallWith, isCallee: false},
			disableClose: true
		});
		
		this._dialDialogRef.afterClosed()
		.subscribe( (res : boolean) => {
			this._dialDialogRef = null;
			if(res === false){
				this._Websocket.sendMessage({
					event : "requestcancelled",
					payload : {
						to : this.inCallWith.id
					}
				});
				this._Websocket.sendMessage({
					event : "incall",
					payload : {
						incall : false
					}
				});
				this.inCallWith = null;
			}
		});
	}
	
	private _closeCallRequestDialog(reason : string){
		if(this._dialDialogRef == null) return;
		
		this._Websocket.sendMessage({
			event : "incall",
			payload : {
				incall : false
			}
		});
		
		if(reason)
			this.Notification.sendNotification(`callcanceled_${this.inCallWith.id}`, {
				title : this.Lang.lang.NotificationTitles.peerHasRejectedCallRequest,
				body : sprintf(reason, this.inCallWith.name),
				icon : `${this._Config.URL}assets/avatars/${this.inCallWith.picture}.svg`,
				isToast : true,
				isNotification : true
			});
			
		this._dialDialogRef.close();
	}
	
	PhotoPreview : Photo;
	private _photoBootRef;
	openPhotoBoot(){
		if(this._photoBootRef != null) return;
		
		
		this._photoBootRef = this._Dialog.open(PhotoBoot, {
			disableClose: true
		});
		
		this._photoBootRef.afterClosed()
		.subscribe( (photo) => {
			if(!photo) return;
			this._photoBootRef = null;
			this.PhotoPreview = photo;
			this.PhotoPreview.url = this.sanitize(URL.createObjectURL(photo.blob));
		});
	}
	
	private _pickupDialogRef;
	private _openPickUpDialog(user : Presentation){
		if(this._pickupDialogRef != null) return;
		this.inCallWith = user;
		
		this._Websocket.sendMessage({
			event : "incall",
			payload : {
				incall : true
			}
		});
		this._pickupDialogRef = this._Dialog.open(DialDialog, {
			data: {user: this.inCallWith, isCallee: true},
			disableClose: true
		});
		
		this._pickupDialogRef.afterClosed()
		.subscribe( (res : boolean) => {
			
			this._pickupDialogRef = null;
			
			if(res === true){
				this._Websocket.sendMessage({
					event : "callaccepted",
					payload : {
						to : this.inCallWith.id
					}
				});
				this._openCallDialog();
				this.Media.startVideoFeed$().subscribe({
					next : (stream) => {
						this._RTC.addLocalStream(stream);
					},
					error : (e) => {
						this._Websocket.sendMessage({
							event : "hangup",
							payload : {
								to : this.inCallWith.id,
								reason : "technicalProblems"
							}
						});
						this._closeCallDialog();
					}
				});
			}else if(res === false){				
				this._Websocket.sendMessage({
					event : "incall",
					payload : {
						incall : false
					}
				});
				this._Websocket.sendMessage({
					event : "callrejected",
					payload : {
						to : this.inCallWith.id
					}
				});
				this.inCallWith = null;
			}else{
				this._Websocket.sendMessage({
					event : "incall",
					payload : {
						incall : false
					}
				});
				this.inCallWith = null;
			}
		});
	}
	
	private _closePickUpDialog(reason : string){
		if(this._pickupDialogRef == null) return;
		
		if(reason)
			this.Notification.sendNotification(`callcanceled_${this.inCallWith.id}`, {
				title : this.Lang.lang.NotificationTitles.peerHasRejectedCallRequest,
				body : sprintf(reason, this.inCallWith.name),
				icon : `${this._Config.URL}assets/avatars/${this.inCallWith.picture}.svg`,
				isToast : true,
				isNotification : true
			});
			
		this._pickupDialogRef.close();
	}
	
	sendNudge(user : Presentation){
		const ev = {event: "nudge", payload: {nudge: "1", to: user.id}};
		this._Websocket.sendMessage(ev);
	}
	
	private _sendPresentation(){
		
		const ev : PresentationEvent = {
			event : "presentation",
			payload: { ...this.User }
		};
		this._Websocket.sendMessage(ev);
	}
	
	private _beginConnection(){
		if(this._Websocket.online) return;
		setTimeout(() => this._openConnectingDialog());
		
		const idPromise = isDevMode() ? this._Identity.FauxFingerprint : this._Identity.Fingerprint;
		
		idPromise()
		.then( (fingerprint : string) => {
			
			this._GeoLocation.getPosition()
			.then( (position : GeoPos) => {
				
				const routeParams = this._activeRoute.snapshot.queryParams;
				
				const con : ConnectionPayload = {
					lat: position.lat,
					lon: position.lon,
					pcid: fingerprint
				};
				
				if(routeParams.channel)
					con.channel = routeParams.channel;
				
				this._Websocket.connect$(con).subscribe(this._socketOnlineSubscriber);
			});
		});
	}

	private _checkIfLandscape(){
		this.isLandscape = window.innerWidth >= window.innerHeight;
		if(this.isLandscape)
			this.width = `${window.innerWidth * 0.25}px`;
		else
			this.width = `${window.innerWidth * 0.8}px`;
	}

	private _audioSub;
	audioBlobURL;
	
	private _audioRecSubscription = {
		next : (audio) => {
			this.audioBlobURL = this.sanitize(URL.createObjectURL(audio));
			this.messagePayload.media = audio;
		},
		complete : () => {
			this._audioSub.unsubscribe();
			this._audioSub = null;
		},
		error : () => {
			//todo error dialog
		}
	};
	
	startRecording(){
		if(this._audioSub) return;
		this._audioSub = this.Media.startAudioRecording$().subscribe(this._audioRecSubscription);
	}
	
	stopRecording(){
		this.Media.stopAudioRecording();
	}
	
	toggleRecording() : void{
		if(this.isPortrait) return;
		if(this.Media.isRecordingAudio) this.stopRecording();
		else this.startRecording();
	}
	
	private _sendIsTyping(isit : boolean){
		const ev = {event: "istyping", payload: {istyping: isit}};
		this._Websocket.sendMessage(ev);
	}
	private _typingTimeout;
	
	onKeydown(e){
		if(e.keyCode != 13){
			if(this._typingTimeout){
				clearTimeout(this._typingTimeout);
			}else
				this._sendIsTyping(true);
			
			this._typingTimeout = setTimeout(() => {
				this._sendIsTyping(false);
				this._typingTimeout = null;
			}, 5000);
		}else{
			if(this._typingTimeout != null)
				clearTimeout(this._typingTimeout);
			this._typingTimeout = null;
			this._sendIsTyping(false);
			this.sendMessage();
			e.preventDefault();
		}
	}

	share() : void {
		const textArea = document.createElement("textarea");
		textArea.style.position = 'fixed';
		textArea.style.top = "0px";
		textArea.style.left = "0px";
		textArea.style.width = '2em';
		textArea.style.height = '2em';
		textArea.style.padding = "0px";
		textArea.style.border = 'none';
		textArea.style.outline = 'none';
		textArea.style.boxShadow = 'none';
		textArea.style.background = 'transparent';
		textArea.value = `${this._Config.URL}?channel=${this.Channel.id}`;
		document.body.appendChild(textArea);
		textArea.focus();
		textArea.select();
		try {
			document.execCommand('copy');
			this.Notification.sendNotification(`copied`, {
				body : this.Lang.lang.NotificationBodies.copied,
				isToast : true
			});
		} catch (err) {}
		
		document.body.removeChild(textArea);
	}
}
