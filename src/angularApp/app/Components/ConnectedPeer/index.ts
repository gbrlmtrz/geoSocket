import { Component, Inject, EventEmitter, Input, Output } from '@angular/core';
import { LangService } from '@Services/lang.service';
import { RTCService } from '@Services/rtc.service';
import { Presentation } from '@Interfaces/Events/PresentationEvent';

@Component({
	selector: 'connected-peer',
	templateUrl: 'layout.html',
	styleUrls: ['./style.css']
})
export class ConnectedPeer {

	@Input('user')
	User : Presentation;
	
	@Output('calling')
	calling = new EventEmitter<Presentation>();
	
	@Output('nudging')
	nudging = new EventEmitter<Presentation>();
	
	disableNudge : boolean = false;
	
	constructor(public Lang : LangService, public RTC : RTCService) {
			
	}

	call() : void{
		this.calling.emit(this.User);
	}
	
	nudge() : void{
		this.disableNudge = true;
		setTimeout( () => {
			this.disableNudge = false;
		}, 3000);
		this.nudging.emit(this.User);
	}
	
}