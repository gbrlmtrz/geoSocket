import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { RTCService } from '@Services/rtc.service';
import { LangService } from '@Services/lang.service';
import { Presentation } from '@Interfaces/Events/PresentationEvent';

@Component({
	selector: 'name-picker-dialog',
	templateUrl: 'layout.html',
	styleUrls: ['./style.css']
})
export class CallDialog {

	filters  = [
		{name: "SF", class: ""},
		{name: "1977", class: "filter-1977"},
		{name: "Aden", class: "filter-aden"},
		{name: "Amaro", class: "filter-amaro"},
		{name: "Ashby", class: "filter-ashby"},
		{name: "Brannan", class: "filter-brannan"},
		{name: "Brooklyn", class: "filter-brooklyn"},
		{name: "Charmes", class: "filter-charmes"},
		{name: "Clarendon", class: "filter-clarendon"},
		{name: "Crema", class: "filter-crema"},
		{name: "Dogpatch", class: "filter-dogpatch"},
		{name: "Earlybird", class: "filter-earlybird"},
		{name: "Gingham", class: "filter-gingham"},
		{name: "Ginza", class: "filter-ginza"},
		{name: "Hefe", class: "filter-hefe"},
		{name: "Helena", class: "filter-helena"},
		{name: "Hudson", class: "filter-hudson"},
		{name: "Inkwell", class: "filter-inkwell"},
		{name: "Juno", class: "filter-juno"},
		{name: "Kelvin", class: "filter-kelvin"},
		{name: "Lark", class: "filter-lark"},
		{name: "Lofi", class: "filter-lofi"},
		{name: "Ludwig", class: "filter-ludwig"},
		{name: "Maven", class: "filter-maven"},
		{name: "Mayfair", class: "filter-mayfair"},
		{name: "Moon", class: "filter-moon"},
		{name: "Nashville", class: "filter-nashville"},
		{name: "Perpetua", class: "filter-perpetua"},
		{name: "Poprocket", class: "filter-poprocket"},
		{name: "Reyes", class: "filter-reyes"},
		{name: "Rise", class: "filter-rise"},
		{name: "Sierra", class: "filter-sierra"},
		{name: "Skyline", class: "filter-skyline"},
		{name: "Slumber", class: "filter-slumber"},
		{name: "Stinson", class: "filter-stinson"},
		{name: "Sutro", class: "filter-sutro"},
		{name: "Toaster", class: "filter-toaster"},
		{name: "Valencia", class: "filter-valencia"},
		{name: "Vesper", class: "filter-vesper"},
		{name: "Walden", class: "filter-walden"},
		{name: "Willow", class: "filter-willow"},
		{name: "XPro II", class: "filter-xpro-ii"}
	];

	private _filter = "";
	set filter(val : string){
		this._filter = val;
		this.RTC.sendChannelMessage({filter : val});
	}
	
	get filter(){
		return this._filter;
	}
	
	theirFeed;
	theirFilter;

	private _streamSub;
	private _trackSub;
	private _mesSub;
	
	constructor(
		public Lang : LangService,
		public RTC : RTCService,
		public dialogRef: MatDialogRef<CallDialog>,
		@Inject(MAT_DIALOG_DATA) public User : Presentation) {
	}
	
	ngOnDestroy(){
		
	}
	
	ngOnInit() {
		this.filters[0].name = this.Lang.lang.CallDialog.noFilter;
		
		this._streamSub = this.RTC.remoteStream$.subscribe({
			next : (stream) => {
				this.theirFeed = stream[0];
			}
		});
		
		this._trackSub = this.RTC.remoteTrack$.subscribe({
			next : (track) => {
				this.theirFeed = track[0];
			}
		});
		
		this._mesSub = this.RTC.channelMessages$.subscribe({
			next : (data) => {
				if(data.hasOwnProperty("filter")){
					this.theirFilter = data.filter;
				}
			}
		});
	}
	

	hangup(){
		this._close();
		this.dialogRef.close(true);
	}
	
	private _close(){
		this._streamSub.unsubscribe();
		this._trackSub.unsubscribe();
		this._mesSub.unsubscribe();
	}

}