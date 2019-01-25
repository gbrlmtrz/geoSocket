import { Observable, Observer } from 'rxjs';
import { Injectable } from '@angular/core';
//import {Lzp3} from '@faithlife/compressjs';
import { inflate, deflate } from 'pako';
import str2ab from 'string-to-arraybuffer';
import ab2str from 'arraybuffer-to-string';
import {arrayBufferToBlob} from 'blob-util';
import uuid from 'uuid/v4';

declare const FileReader : any;
declare const SharedWorker : any;
declare const Worker : any;

@Injectable({
	providedIn: 'root'
})
export class CompresorService {
	
	private _Worker;
	private _Port;
	private _withSharedWorker : boolean = false;
	private _withWorker : boolean = false;
	private _inMainThread : boolean = false;
	private _resolvers : Map<string, any> = new Map();
	
	constructor() {
		/*if(("SharedWorker" in window) || (<any> window).SharedWorker != undefined){
			this._Worker = new SharedWorker("/compresor/compresor.js");
			this._Port = this._Worker.port;
			this._Port.addEventListener("message", this._OnMessage.bind(this));
			this._Port.start();
			this._withSharedWorker = true;
		}else */if(("Worker" in window) || (<any> window).Worker != undefined){
			this._Worker = new Worker("/compresor/dist/compresor.js");
			this._Worker.addEventListener("message", this._OnMessage.bind(this));
			this._withWorker = true;
		}else this._inMainThread = true;
	}
	
	private _OnMessage(e) : void{
		switch(e.data.intent){
			case "encoded":
			case "decoded":
			case "compressed":
			case "decompressed":
				this._resolvers.get(e.data.uuid)(e.data.payload);
				this._resolvers.delete(e.data.uuid);
				break;
		}
	}
	
	private _decode(data : string){
		const rebuff = str2ab(data);
		return arrayBufferToBlob(rebuff);
	}
	
	private _encode(data : Blob){
		return new Promise((resolve) => {
			const reader = new FileReader();
			reader.onload = function() {
				resolve(reader.result);
			};
			reader.readAsDataURL(data);
		});
	}
	
	private _compress(data : Blob){
		return new Promise( (resolve) => {		
			const fileReader = new FileReader();
			fileReader.onload  = function(event) {
				const arrayBuffer = event.target.result;
				const uint8Array  = new Uint8Array(arrayBuffer);
				const compressed = deflate(uint8Array, {level : 9});
				const com = ab2str(compressed, 'binary');
				resolve(com);
			};
			fileReader.readAsArrayBuffer(data);
		});
	}
	
	private _decompress(base64string : string) : Blob {
		const rebuff = str2ab(base64string);
		const uint = new Uint8Array(rebuff);
		const decompressed = inflate(uint);
		return arrayBufferToBlob(decompressed);
	}
	
	decode(data : string) : Promise<Blob>{
		return new Promise((resolve) => {
			if(this._inMainThread) return this._decode(data);
			const _uuid = uuid();
			this._resolvers.set(_uuid, resolve);
			
			if(this._withSharedWorker){
				this._Port.postMessage({intent: "decode", payload: data, uuid: _uuid});
			}else if(this._withWorker){
				this._Worker.postMessage({intent: "decode", payload: data, uuid: _uuid});
			}
			
		});
	}
	
	decompress(data : string) : Promise<Blob>{
		return new Promise((resolve) => {
			if(this._inMainThread) return this._decompress(data);
			const _uuid = uuid();
			this._resolvers.set(_uuid, resolve);
			
			if(this._withSharedWorker){
				this._Port.postMessage({intent: "decompress", payload: data, uuid: _uuid});
			}else if(this._withWorker){
				this._Worker.postMessage({intent: "decompress", payload: data, uuid: _uuid});
			}
			
		});
	}
	
	compress(data : Blob) : Promise<any>{
		if(this._inMainThread) return this._compress(data);
		return new Promise( (resolve, reject) => {
			if(this._withSharedWorker){
				const _uuid = uuid();
				
				this._resolvers.set(_uuid, resolve);
				this._Port.postMessage({intent: "compress", payload: data, uuid: _uuid});
			}else if(this._withWorker){
				const _uuid = uuid();
				
				this._resolvers.set(_uuid, resolve);
				this._Worker.postMessage({intent: "compress", payload: data, uuid: _uuid});
			}
		});
	}
	
	encode(data : Blob) : Promise<any>{
		if(this._inMainThread) return this._encode(data);
		return new Promise( (resolve, reject) => {
			if(this._withSharedWorker){
				const _uuid = uuid();
				
				this._resolvers.set(_uuid, resolve);
				this._Port.postMessage({intent: "encode", payload: data, uuid: _uuid});
			}else if(this._withWorker){
				const _uuid = uuid();
				
				this._resolvers.set(_uuid, resolve);
				this._Worker.postMessage({intent: "encode", payload: data, uuid: _uuid});
			}
		});
	}
	
}