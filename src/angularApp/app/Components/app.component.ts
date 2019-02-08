import { Component, OnInit, ViewChild, HostListener } from '@angular/core';
import { MatDialog } from '@angular/material';
import { LangService } from '@Services/lang.service';
import { MediaService } from '@Services/media.service';
import { RTCService } from '@Services/rtc.service';
import { CompresorService } from '@Services/compresor.service';
import { IdentityService } from '@Services/identity.service';
import { GeoLocationService } from '@Services/geolocation.service';
import { NotificationService } from '@Services/notification.service';
import { VisibilityService } from '@Services/visibility.service';
import { WebsocketService } from '@Services/websocket.service';
import { DomSanitizer } from '@angular/platform-browser';
import GeoPos from '@Interfaces/GeoPos';
import { Subscription } from 'rxjs';
import ConnectionPayload from '@Interfaces/ConnectionPayload';
import { default as MessageEvent, MessagePayload, Message } from '@Interfaces/Events/MessageEvent';
import { NamePickerDialog } from '@Components/Dialogs/NamePickerDialog';
import { ConnectingDialog } from '@Components/Dialogs/ConnectingDialog';
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
	
	@HostListener('window:resize')
    onWindowResize() {
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
        this.resizeTimeout = setTimeout(this._checkIfLandscape.bind(this), 500);
    }
	
	myFeed: MediaStream;
	theirFeed: MediaStream;
	
	posSubscription;
	pictures : string[] = [];
	classes : string[] = [
		"filter-1977",
		"filter-amaro",
		"filter-crema",
		"filter-hefe",
		"filter-inkwell",
		"filter-kelvin",
		"filter-lofi",
		"filter-poprocket",
		"filter-sutro",
		"filter-xpro-ii"
	];
	
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
				this._openConnectingDialog();
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
	
	private _messagesSubscriber = {
		next : data => {			
			console.log("event", data);
			switch(data.event){
				case "nudge":
					if(this._nudgeTimeout)
						clearTimeout(this._nudgeTimeout);
					this.nudging = true;
					this._nudgeTimeout = setTimeout( () => {
						this.nudging = false;
					} , 2000);
					break;
				case "message":
					if(data.sender != this._myID)
						this._addMessage(data.payload, data.sender);
					else if(this._MessageDictionary.has(data.payload.id))
						this._MessageDictionary.get(data.payload.id).recieved = true;
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
					if(this.Users.has(data.payload.peer))
						this.Users.delete(data.payload.peer);
					break;
				case "newPeer":
					this.Users.set(data.payload.id, {id: data.payload.id, ...this._Anonymous});
					/*to = data.payload.id;
					this._RTC.connect();
					this._RTC.createOffer()
					.then( (sdp) => {
						this._Websocket.sendMessage({event: "rtccall", payload: { sdp : { sdp : sdp.sdp, type : sdp.type }, to : data.payload.id}});
					});*/
					break;
				case "presentation":
					this.Users.set(data.sender, {...data.payload});
					break;
				/*case "ice":
					this._RTC.newICECandidate(data.payload.ice);
					break;
				case "rtccall":
					this._RTC.acceptOffer(data.payload.sdp)
					.then((sdp) => {
						this._Websocket.sendMessage({event: "rtcaccept", payload: { sdp : { sdp : sdp.sdp, type : sdp.type }, to : data.sender}});
					});
					break;
				case "rtcaccept":
					this._RTC.offerAcepted(data.payload.sdp);
					break;*/
			}
		},
		error: e => {
			
		},
		complete: () => {
			
		}
	};
	
	constructor(
		private _Sanitizer : DomSanitizer, 
		public Lang : LangService, 
		private _Dialog: MatDialog,
		private _RTC : RTCService, 
		public Media : MediaService, 
		private _Compresor : CompresorService, 
		private _Notification : NotificationService, 
		private _Websocket : WebsocketService, 
		private _Visibility : VisibilityService, 
		private _Identity : IdentityService, 
		private _GeoLocation : GeoLocationService
	) {
	}
	
	sanitize( url : string){
		return this._Sanitizer.bypassSecurityTrustUrl(url);
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
		
		this._Websocket.messages$.subscribe(this._messagesSubscriber);
		
		
		/*this._Media.startVideoFeed$().subscribe({
			next : (stream) => {
				this.myFeed = stream;
				this._RTC.addLocalStream(this.myFeed);
				
				this._Fingerprint.FauxFingerprint()
				.then( (fingerprint : string) => {
					
					this._GeoLocation.getPosition()
					.then( (position : GeoPos) => {
						
						const con : ConnectionPayload = {
							lat: position.lat,
							lon: position.lon,
							pcid: fingerprint
						};
						this._Websocket.connect$(con).subscribe({
							next : (online : boolean) => { 
								if(online){
									
									
								}
							}
						});
						
						let to;
						
						this._RTC.ICE$.subscribe({
							next : (ice) => {
								this._Websocket.sendMessage(
								{
									event: "ice", 
									payload: { 
										ice : { 
											candidate : ice.candidate,
											sdpMid : ice.sdpMid,
											sdpMLineIndex: ice.sdpMLineIndex
										}, 
										to : to 
									}
								});
							}
						});
						
						this._RTC.remoteStream$.subscribe({
							next : (stream) => {
								console.log("stream", stream);
								this.theirFeed = stream[0];
								
							}
						});
						
						this._RTC.remoteTrack$.subscribe({
							next : (track) => {
								console.log("track", track);
							}
						});
						
						this._Websocket.messages$.subscribe({
							next : (data) => {
								console.log("event", data);
								switch(data.event){
									case "newPeer":
										to = data.payload.id;
										this._RTC.connect();
										this._RTC.createOffer()
										.then( (sdp) => {
											this._Websocket.sendMessage({event: "rtccall", payload: { sdp : { sdp : sdp.sdp, type : sdp.type }, to : data.payload.id}});
										});
										break;
									case "ice":
										this._RTC.newICECandidate(data.payload.ice);
										break;
									case "rtccall":
										this._RTC.acceptOffer(data.payload.sdp)
										.then((sdp) => {
											this._Websocket.sendMessage({event: "rtcaccept", payload: { sdp : { sdp : sdp.sdp, type : sdp.type }, to : data.sender}});
										});
										break;
									case "rtcaccept":
										this._RTC.offerAcepted(data.payload.sdp);
										break;
								}
							}
						});
						
					})
					.catch( (e) => {console.error(e);} );
					
				} );
				
				
			}
		});*/
		/*const video = document.getElementById("video");
		this._Video.startCameraFeed$().subscribe({
			next: (stream) => {
				
				(<any> video).srcObject = stream;
				(<any> video).play();
				
				this._Video.photosOutput$.subscribe({
					next : (photo) => {
						const reader = new FileReader();
						reader.onload  = () => {
							const base64data = reader.result;                
							this.pictures.push(<string> base64data);
						};
						reader.readAsDataURL(photo);
					}
				});
				
				let i = 0;
				setTimeout(() => {
					let inverval = setInterval(() => {
						if(i > 0){
							video.classList.remove(this.classes[i-1]);
						}
						video.classList.add(this.classes[i]);
						this._Video.setFilterClass(window.getComputedStyle(video).filter);
						this._Video.takePhoto();
						i++;
					}, 1000);
					
					setTimeout( () => {
						clearInterval(inverval);
						this._Video.stopCapturing();
					}, 10000);
				}, 1000);
				
			},
			complete : () => {
				(<any> video).pause();
				(<any> video).removeAttribute('src');
				(<any> video).load();
			},
			error : () => {
				(<any> video).pause();
				(<any> video).removeAttribute('src');
				(<any> video).load();
			}
		});*/
		
		/*this._Audio.startRecording$().subscribe({
			next: d => {
				const reader = new FileReader();
				 reader.onload  = function() {
					 const base64data = reader.result;                
					 console.log(`Compressed old blob ${base64data.length}`);
				 };
				 reader.readAsDataURL(d); 
				
				this._Compresor.compress(d)
				.then( (compressedText) => {
					
					this._Compresor.decompress(compressedText)
					.then( (newBlob) => {
						
						console.log("newBlob", newBlob);
						const audioUrl = URL.createObjectURL(newBlob);
						console.log(audioUrl);
						const audio = new Audio(audioUrl);
						audio.play();
					});
					
				});
				
			},
			complete: () => {
				console.log("Complete");
			},
			error: (e) => {
				console.log(e)
			}
		});
		
		setTimeout(() => {
			this._Audio.stopRecording()
		}, 10 * 1000)*/
		
		/*this._Notification.requestPermission();
		
		setTimeout( () => {
			this._Notification.sendNotification(`${Math.random()}`, {title: "Hola", body: "holaaaa!"})
		}, 5000);
		
		this._Visibility.visibility$.subscribe({
			next : (visible : boolean ) => {
				console.log(`Is it visible? ${visible}`);
			}
		});*/
		
		/*this._Fingerprint.Fingerprint()
		.then( (fingerprint : string) => {
			
			this._GeoLocation.getPosition()
			.then( (position : GeoPos) => {
				
				const con : ConnectionPayload = {
					lat: position.lat,
					lon: position.lon,
					pcid: fingerprint
				};
				this._Websocket.connect$(con).subscribe({
					next : (online : boolean) => { 
						if(online){
							
							this._Audio.startRecording$().subscribe({
								next: d => {
									
									console.log("recorded", d.size);
									
									this._Compresor.compress(d)
									.then( (compressedText) => {
										
										console.log("compressed", compressedText.length);
										
										const newMessage : MessageEvent = {
											event : "message",
											payload: {
												media: compressedText
											}
										};
										
										this._Websocket.sendMessage(newMessage);
									});
									
								},
								complete: () => {
									console.log("Complete");
								},
								error: (e) => {
									console.log(e)
								}
							});
							
							setTimeout(() => {
								this._Audio.stopRecording()
							}, 10 * 1000)
							
						}
					}
				});
				
				this._Websocket.messages$.subscribe({
					next : (data) => {
						console.log("New message", data);
						
						if(data.event == "message"){
							this._Compresor.decompress(data.payload.media)
							.then( (newBlob) => {
								const audioUrl = URL.createObjectURL(newBlob);
								console.log(audioUrl);
								const audio = new Audio(audioUrl);
								audio.play();
							});
						}
					}
				});
				
				//this.posSubscription = this._GeoLocation.positions$.subscribe({
				//	next : (data : GeoPos) => {
				//		console.log("Data1: ", data);
				//	}
				//});
				
			})
			.catch( (e) => {console.error(e);} );
			
		} );*/
	}
	
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
		if(!this._Websocket.online || 
			( 
				(!this.messagePayload.message || this.messagePayload.message.length == 0) &&
				!this.messagePayload.media
			)
		) return;
		this.messagePayload.id = nanoid();
		if(this.Quote)
			this.messagePayload.quote = this.Quote.id;
		
		this.Quote = null;
		const ev : MessageEvent = {event: "message", payload: this.messagePayload};
		
		ev.payload.date = Date.now();
		this._addMessage(ev.payload, this._myID);
		if(ev.payload.media){
			this._Compresor.compress(ev.payload.media)
			.then( (compressedText) => {
				ev.payload.media = compressedText;
				console.log("I AM GOING TO SEND", ev);
				this._Websocket.sendMessage(ev);
			});
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
	
	sendCall(user : Presentation){
		console.log("call");
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
		this._Identity.FauxFingerprint()
		.then( (fingerprint : string) => {
			
			this._GeoLocation.getPosition()
			.then( (position : GeoPos) => {
				
				const con : ConnectionPayload = {
					lat: position.lat,
					lon: position.lon,
					pcid: fingerprint
				};
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
	
	onKeydown(e){
		if(e.keyCode == 13){
			this.sendMessage();
			e.preventDefault();
		}
	}
}
