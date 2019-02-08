import { Observable, Observer } from 'rxjs';
import { Injectable } from '@angular/core';
import GeoPos from '@Interfaces/GeoPos';
import Position from '@Interfaces/Position';
import PositionOptions from '@Interfaces/PositionOptions';
import { VisibilityService } from '@Services/visibility.service';

@Injectable({
	providedIn: 'root'
})
export class GeoLocationService {

	_geoPos : GeoPos;
	private _visibilitySubscription;
	private _earthRadius = 6371000000;
	private _minDistanceToNotify = 10;
	private _watchID : number;
	private _positionOptions : PositionOptions = {
		enableHighAccuracy: false,
		timeout : 	4 * 60 * 1000,
		maximumAge: 5 * 60 * 1000
	};

	private _positionObservers : Observer<any>[] = [];
	
	private deg2rad(deg){
		return deg * (Math.PI/180);
	}
	
	positions$ : Observable<GeoPos> = new Observable<GeoPos>((observer : Observer<any>) => {
		this._positionObservers.push(observer);
		
		if(!("geolocation" in navigator)){
			observer.error(new Error());
			return;
		}
		
		if(this._positionObservers.length == 1){
			this._visibilitySubscription = this._Visibility.visibility$.subscribe( {
				next : (visible) => {
					if(visible) this._startWatch();
					else this._stopWatch();
				} 
			} );
		}
		
		return {
			unsubscribe: () => {
				this._positionObservers.splice(this._positionObservers.indexOf(observer), 1);
				if (this._positionObservers.length === 0) {
					this._stopWatch();
					this._visibilitySubscription.unsubscribe();
				}
			}
		};
	});

	private _startWatch(){
		this._watchID = navigator.geolocation.watchPosition(this._positionUpdate.bind(this), this._positionError.bind(this), this._positionOptions);
	}
	
	private _stopWatch(){
		navigator.geolocation.clearWatch(this._watchID);
		this._watchID = null;
	}
	
	getPosition() : Promise<GeoPos>{
		return new Promise( (resolve, reject) => {
			if(this._geoPos != null) resolve(this._geoPos);
			
			if (navigator.geolocation) {
				navigator.geolocation.getCurrentPosition(
					(position : Position) => {
						this._geoPos = {
							lat : position.coords.latitude,
							lon : position.coords.longitude
						};
						resolve(this._geoPos);
					});
			} else {
				reject();
			}
		});
	}
	
	distance(position1 : GeoPos, position2 : GeoPos) : number{
		const dLat = this.deg2rad(position1.lat - position2.lat);
		const dLon = this.deg2rad(position1.lon - position2.lon);
		
		const a =  Math.sin(dLat/2) * Math.sin(dLat/2) +
			Math.cos(this.deg2rad(position2.lat)) * Math.cos(this.deg2rad(position1.lat)) *
			Math.sin(dLon/2) * Math.sin(dLon/2); 
		
		return this._earthRadius * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
	}
	
	private _positionUpdate(position : Position) : void{
		const newPos = {
			lat : position.coords.latitude,
			lon : position.coords.longitude
		};
		
		if(this.distance(newPos, this._geoPos) >= this._minDistanceToNotify){
			this._geoPos = newPos;
			this._positionObservers.forEach( obs => obs.next(this._geoPos) );
		}
	}
	
	private _positionError(e) : void{
		this._positionObservers.forEach( obs => obs.error(new Error(e)) );
	}
	
	constructor(private _Visibility : VisibilityService) { 
	}
	
	close(){
		this._stopWatch();
		this._positionObservers.forEach( obs => obs.complete() );
		this._positionObservers = [];
	}
	
}
