import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';

@Injectable({
	providedIn: 'root'
})
export class ConfigService{

	constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

	get API(){
		if(isPlatformBrowser(this.platformId)){
			return "http://localhost:8082/"
		}else{
			return "http://localhost:8082/";
		}
	}
	
	get WS(){
		return "wss://localhost:8082/socket?";
	}
	
}
