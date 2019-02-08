import { Injectable } from '@angular/core';
import { HTTPService } from '@Services/http.service';
import Lang from '@Interfaces/Entities/lang'
import LangResponse from '@Interfaces/lang-response';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import _Lang from '../../../logic/langs/site/es.json';

@Injectable({
	providedIn: 'root'
})
export class LangService{

	lang : any = _Lang;
	currentLang : string;

	constructor(
		private http : HTTPService,
		private activeRoute: ActivatedRoute
	){
		this.activeRoute.queryParams.subscribe( params => {
			if(params["lang"] && params["lang"] != this.getCurrentLang())
				this.setLang(params["lang"]);
		});
	}

	getCurrentLang() : string{
		if(this.currentLang == null)
			this.currentLang = localStorage.getItem('lang') || "es";
		return this.currentLang;
	}

	getLang() : void{
		this.http.get<LangResponse>(`langs/web/${this.getCurrentLang()}`)
			.subscribe(
				(data : LangResponse) => {
					if(data.success){
						this.lang = data.item;
					}
				},
				error => {}
			);
	}

	setLang(lang : string = "es") : void{
		if(lang == this.currentLang) return;
		this.currentLang = lang;
		localStorage.setItem('lang', lang);
		this.getLang();
	}

}
