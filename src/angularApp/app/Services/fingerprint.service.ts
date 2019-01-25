import { Injectable } from '@angular/core';
import Fingerprint2 from 'fingerprintjs2';

@Injectable({
	providedIn: 'root'
})
export class FingerprintService {

	constructor() { }

	Fingerprint() : Promise<string>{
		return new Promise( (resolve) => {
			let key = localStorage.getItem("fingerPrint");
			if(key != null) resolve(key);
			
			Fingerprint2.get( (components) => {
				resolve(Fingerprint2.x64hash128(components.map(function (pair) { return pair.value }).join(), 31));
			});
			
		});
	}
	
}
