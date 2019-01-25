import { Observable, Observer } from 'rxjs';
import { Injectable } from '@angular/core';
import ConnectionPayload from '@Interfaces/ConnectionPayload';
import Event from '@Interfaces/Event';
import { ConfigService } from '@Services/config.service';
import { deserialize, serialize } from 'bson';
import { inflate, deflate } from 'pako';

declare const SharedWorker : any;
declare const Worker : any;
declare const ArrayBuffer : any;
declare const Blob : any;
declare const WebSocket : any;

@Injectable({
	providedIn: 'root'
})
export class WebsocketService {
	
	private _Worker;
	private _Socket;
	private _withWebSocket : boolean = false;
	private _connectionData : ConnectionPayload;
	private _wsURL : string;
	private _connected : boolean = false;
	
	private _connectedObservers : Observer<any>[] = [];
	private _messagesObservers : Observer<any>[] = [];
	
	messages$ : Observable<Event> = new Observable<Event>( (observer : Observer<any>) => {
		this._messagesObservers.push(observer);
		return {
			unsubscribe: () => {
				this._messagesObservers.splice(this._messagesObservers.indexOf(observer), 1);
			}
		};
	});
	
	connected$ : Observable<boolean> = new Observable<boolean>( (observer : Observer<any>) => {
		this._connectedObservers.push(observer);
		observer.next(this._connected);
		return {
			unsubscribe: () => {
				this._connectedObservers.splice(this._connectedObservers.indexOf(observer), 1);
			}
		};
	});
	
	constructor(private _Config: ConfigService) {
		if(("Worker" in window) || (<any> window).Worker != undefined){
			this._Worker = new Worker("/socketClient/dist/socketClient.js");
			this._Worker.onerror = this._onError.bind(this);
			this._Worker.onmessage = this._onWorkerMessage.bind(this);
		}else{
			this._withWebSocket = true;
		}
	}
	
	get connected() : boolean{
		return this._connected;
	}
	
	set connected(val : boolean){
		this._connected = val;
		this._connectedObservers.forEach( obs => obs.next(val) );
	}
	
	private _onWorkerMessage(e){
		switch(e.data.intent){
			case "close":
				this.connected = false;
				break;
			case "error":
				this.connected = false;
				this._onError(e.data.payload);
				break;
			case "open":
				this.connected = true;
				break;
			case "message":
				this._onMessage(e.data.payload);
				break; 
		}
	}
	
	private _onError(e){
		console.log(e);
	}
	
	private _onMessage(payload : Event){
		this._messagesObservers.forEach( obs => obs.next(payload) );
	}
	
	private _connectWithWorker(){
		this._Worker.postMessage({intent: "connect", url: this._wsURL});
	}
	
	private _deflateData(arrayBuffer){
		const uint8array = new Uint8Array(arrayBuffer);
		const deflated = inflate(uint8array);
		this._onMessage(deserialize(deflated));
	}
	
	private _connectWithWS(){
		this._Socket = new WebSocket(this._wsURL);
		this._Socket.addEventListener("open", () => this.connected = true );
		this._Socket.addEventListener("close", () => this.connected = false );
		this._Socket.addEventListener("error", () => this.connected = false );
		this._Socket.addEventListener("message", d => {
			if(d.data instanceof Blob){
				const reader = new FileReader();
				reader.addEventListener('loadend', (e) => {
					this._deflateData(reader.result);
				}, false)
				reader.readAsArrayBuffer(d.data)
			}else if(d.data instanceof ArrayBuffer){
				this._deflateData(d.data);
			}
		});
	}
	
	private _connect() : void{
		if(this._withWebSocket) this._connectWithWS();
		else this._connectWithWorker();
	}
	
	sendMessage(event : Event) : void{
		if(!this._connected) return;
		if(this._withWebSocket) this._Socket.send(deflate(serialize(event), {level: 9}));
		else this._Worker.postMessage({intent: "send", payload: event});	
	}
	
	connect$(connectionPayload : ConnectionPayload) : Observable<boolean>{
		this._connectionData = connectionPayload;
		const pieces : string[] = [];
		for(let key in connectionPayload){
			pieces.push(`${key}=${connectionPayload[key]}`);
		}
		const params : string = pieces.join("&");
		this._wsURL = `${this._Config.WS}${params}`;
		this._connect();
		return this.connected$;
	}
	
	
}