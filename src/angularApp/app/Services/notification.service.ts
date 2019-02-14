import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material';
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
	
	constructor(
		private _Visibility : VisibilityService,
		private _SnackBar: MatSnackBar
	){
	}
	
	get hasAskedBefore() : boolean{
		return (<any> localStorage).getItem("notification.hasAskedBefore") || false;
	}
	
	get enabled() : boolean{
		return (<any> localStorage).getItem("notification.enabled") || false;
	}
	
	set enabled(value : boolean){
		(<any> localStorage).setItem("notification.enabled", value);
	}
	
	get isGranted(){
		return ("Notification" in window) && Notification.permission == "granted";
	}
	
	sendNotification(tag : string, notification : any) : void{
		const obj = {...this._preLoaded, ...notification, tag};
		this._queue.set(tag, obj);
		this.startWork();
	}
	
	private _sendToast(notification){
		this._SnackBar.open(notification.body, null, {duration: 2000});
	}
	
	private _timeoutFun(){
		let i = 0;
		this._queue.forEach((value, key) => {
			i++;
			if(i != this._queue.size)
				delete value.vibrate;
			
			if(this._Visibility.isItVisible && value.isToast){
				this._sendToast(value);
			}else if(this.isGranted && value.isNotification){
				const {title, ...options} = value;
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
		if(!this.enabled) return;
		
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
		(<any> localStorage).setItem("notification.hasAskedBefore", true);
		Notification.requestPermission()
		.then( (awnser) => {
			this._requestLock = false;
			(<any> localStorage).setItem("notification.enabled", true);
		})
		.catch( (e) => {
			this._requestLock = false;
			(<any> localStorage).setItem("notification.enabled", false);
		});
	}
}
