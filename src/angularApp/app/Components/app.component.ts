import { Component, OnInit } from '@angular/core';
import { VideoService } from '@Services/video.service';
import { AudioService } from '@Services/audio.service';
import { CompresorService } from '@Services/compresor.service';
import { FingerprintService } from '@Services/fingerprint.service';
import { GeoLocationService } from '@Services/geolocation.service';
import { NotificationService } from '@Services/notification.service';
import { VisibilityService } from '@Services/visibility.service';
import { WebsocketService } from '@Services/websocket.service';
import GeoPos from '@Interfaces/GeoPos';
import { Subscription } from 'rxjs';
import ConnectionPayload from '@Interfaces/ConnectionPayload';
import MessageEvent from '@Interfaces/MessageEvent';

declare const URL;

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent {
	title = 'geoSocketClient';
	
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
	
	constructor(
		private _Video : VideoService, 
		private _Audio : AudioService, 
		private _Compresor : CompresorService, 
		private _Notification : NotificationService, 
		private _WebsocketService : WebsocketService, 
		private _Visibility : VisibilityService, 
		private _Fingerprint : FingerprintService, 
		private _GeoLocation : GeoLocationService
	) {
	}
	
	ngOnInit() {
		
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
				console.log("response blob", d);
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
				this._WebsocketService.connect$(con).subscribe({
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
										
										this._WebsocketService.sendMessage(newMessage);
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
				
				this._WebsocketService.messages$.subscribe({
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
}
