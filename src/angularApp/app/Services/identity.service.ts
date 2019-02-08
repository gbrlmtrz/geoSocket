import { Injectable } from '@angular/core';
import Fingerprint2 from 'fingerprintjs2';
import { Presentation } from '@Interfaces/Events/PresentationEvent';

@Injectable({
	providedIn: 'root'
})
export class IdentityService {

	constructor() { }

	Fingerprint() : Promise<string>{
		return new Promise( (resolve) => {
			let key = localStorage.getItem("identity.fingerPrint");
			if(key != null) resolve(key);
			
			Fingerprint2.get( (components) => {
				const fingerprint = Fingerprint2.x64hash128(components.map(function (pair) { return pair.value }).join(), 31);
				localStorage.setItem("fingerPrint", fingerprint);
				resolve(fingerprint);
			});
			
		});
	}
	
	clear() : void{
		localStorage.removeItem("identity.fingerPrint");
		localStorage.removeItem("identity.name");
		localStorage.removeItem("identity.picture");
		localStorage.removeItem("identity.color");
	}
	
	getUser() : Presentation {
		return { 
			name : localStorage.getItem("identity.name"),
			picture : localStorage.getItem("identity.picture") || "001",
			color : localStorage.getItem("identity.color") || "ad1457"
		};
	}
	
	saveUser(user : Presentation) : void {
		localStorage.setItem("identity.name", user.name);
		localStorage.setItem("identity.picture", user.picture);
		localStorage.setItem("identity.color", user.color);
	}
	
	FauxFingerprint() : Promise<string>{
		return new Promise( (resolve) => {
			resolve(Math.random()+"");
		});
	}
	
}
