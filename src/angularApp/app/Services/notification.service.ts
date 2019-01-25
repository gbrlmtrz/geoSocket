import { Injectable } from '@angular/core';
import { VisibilityService } from '@Services/visibility.service';

@Injectable({
	providedIn: 'root'
})
export class NotificationService {

	private _queue : Map<string, any> = new Map();
	private _timeout; 
	private _preLoaded : any = {
		badge : "/assets/icons/icon-144x144.png",
		icon : "/assets/icons/icon-144x144.png",
		vibrate : [100, 100, 200, 300, 500]
	};
	private _requestLock : boolean = false;
	
	constructor(private _Visibility : VisibilityService){
	}
	
	get isGranted(){
		return ("Notification" in window) && Notification.permission == "granted";
	}
	
	sendNotification(tag : string, notification : any) : void{
		this._queue.set(tag, {...this._preLoaded, ...notification, tag});
		this.startWork();
	}
	
	private _sendToast(notification){
		
	}
	
	private _timeoutFun(){
		let i = 0;
		this._queue.forEach((value, key) => {
			i++;
			if(i != this._queue.size)
				delete value.vibrate;
			
			const {title, ...options} = value;
			if(this._Visibility.isItVisible)
				this._sendToast(value);
			else if(this.isGranted){
				let n = new Notification(title, options);
				n.onclick = () => {
					window.focus();
					n.close();
				};
			}
		});
		this._queue.clear();
		clearTimeout(this._timeout);
	}
	
	startWork(){
		if(this._timeout != null)
			clearTimeout(this._timeout);
		
		this._timeout = setTimeout( this._timeoutFun.bind(this), 1000 / 15);
	}
	
	stopWork(){
		if(this._timeout != null)
			clearTimeout(this._timeout);
		
		this._queue.clear();
	}
	
	requestPermission(){
		if(this._requestLock || !("Notification" in window) || Notification.permission == "granted") return;
		
		this._requestLock = true;
		
		Notification.requestPermission()
		.then( (awnser) => {
			console.log(awnser);
			this._requestLock = false;
		})
		.catch( (e) => {
			console.log(e);
			this._requestLock = false;
		});
	}
}
