import { Component, Input } from '@angular/core';
import { Message as MessageI } from '@Interfaces/Events/MessageEvent';
import { LangService } from '@Services/lang.service';

@Component({
	selector: 'quote',
	templateUrl: 'layout.html',
	styleUrls: ['./style.css']
})
export class Quote {

	@Input('message')
	Message : MessageI;
	
	constructor(public Lang : LangService) {
			
	}
}