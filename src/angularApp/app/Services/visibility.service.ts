import { Observable, Observer } from 'rxjs';
import { Injectable } from '@angular/core';

@Injectable({
	providedIn: 'root'
})
export class VisibilityService {

	private _hidden : string;
	private _visibilityChange : string;
	private _isItVisible : boolean;
	private _visibilityObservers : Observer<any>[] = [];
	
	visibility$ : Observable<boolean> = new Observable<boolean>( (observer : Observer<any>) => {
		this._visibilityObservers.push(observer);
		if(this._hidden == null){
			observer.error(new Error());
			observer.complete();
			return;
		}
		
		
		if(this._visibilityObservers.length == 1){
			document.addEventListener(this._visibilityChange, this._onVisibilityChange.bind(this), false);
		}
		
		observer.next(this._isItVisible);
		
		return {
			unsubscribe: () => {
				this._visibilityObservers.splice(this._visibilityObservers.indexOf(observer), 1);
				if (this._visibilityObservers.length === 0) {
					document.removeEventListener(this._visibilityChange, this._onVisibilityChange.bind(this), false);
				}
			}
		};
		
	});
	
	private _onVisibilityChange(){
		this._isItVisible = !document[this._hidden];
		this._visibilityObservers.forEach( obs => obs.next(this._isItVisible) );
	}
	
	constructor() {
		
		if ("hidden" in document && typeof (<any> document).hidden !== "undefined") {
			this._hidden = "hidden";
			this._visibilityChange = "visibilitychange";
		} else if ("mozHidden" in document && typeof (<any> document).mozHidden !== "undefined") {
			this._hidden = "mozHidden";
			this._visibilityChange = "mozvisibilitychange"; 
		} else if ("msHidden" in document && typeof (<any> document).msHidden !== "undefined") {
			this._hidden = "msHidden";
			this._visibilityChange = "msvisibilitychange";
		} else if ("webkitHidden" in document && typeof (<any> document).webkitHidden !== "undefined") {
			this._hidden = "webkitHidden";
			this._visibilityChange = "webkitvisibilitychange";
		}
		
		if(this._hidden != null)
			this._isItVisible = !document[this._hidden];
	}
	
	get isItVisible(){
		return this._isItVisible;
	}
	get isItHidden(){
		return !this._isItVisible;
	}
}
