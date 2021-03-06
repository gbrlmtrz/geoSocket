import { isDevMode } from '@angular/core';
import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';

@Injectable({
	providedIn: 'root'
})
export class ConfigService{

	constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

	get URL(){
		return isDevMode() ? "https://localhost:8080/" : "https://app.sixdegreesnear.com/";
	}
	
	get API(){
		return isDevMode() ? "https://localhost:8082/" : "https://app.sixdegreesnear.com/api/";
	}
	
	get WS(){
		return isDevMode() ? "wss://localhost:8082/socket?" : "wss://app.sixdegreesnear.com/socket?";
	}
	
}
