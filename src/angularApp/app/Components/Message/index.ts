import { Component, Inject, EventEmitter, Input, Output } from '@angular/core';
import { LangService } from '@Services/lang.service';
import { Message as MessageI } from '@Interfaces/Events/MessageEvent';

@Component({
	selector: 'message',
	templateUrl: 'layout.html',
	styleUrls: ['./style.css']
})
export class Message {

	@Input('message')
	Message : MessageI;
	
	@Output('quote')
	quote : EventEmitter<MessageI> = new EventEmitter<MessageI>();
	
	constructor(public Lang : LangService) {
	}
	
	reply() : void{
		this.quote.emit(this.Message);
	}
	
	
}