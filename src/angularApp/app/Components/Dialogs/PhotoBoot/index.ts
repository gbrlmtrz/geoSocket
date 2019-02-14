import { ViewChild, Component, OnInit, OnDestroy, Inject, ElementRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { MediaService } from '@Services/media.service';
import { LangService } from '@Services/lang.service';
import { Photo } from '@Interfaces/Photo';

@Component({
	selector: 'name-picker-dialog',
	templateUrl: 'layout.html',
	styleUrls: ['./style.css']
})
export class PhotoBoot {
	@ViewChild('feedElement') feedElement: ElementRef;

	private _selectedFilter : string = "";
	photo : Photo = { filter: ""};
	
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

	feed;
	private _streamSub;
	private _photoSub;
	
	constructor(
		public Lang : LangService,
		public Media : MediaService,
		public dialogRef: MatDialogRef<PhotoBoot>) {
	}
	
	ngOnDestroy(){
		this._close();
	}
	
	ngOnInit(){
		this.filters[0].name = this.Lang.lang.photoBoot.noFilter;
		
		this._streamSub = this.Media.startCameraFeed$().subscribe({
			next : (stream) => {
				this.feed = stream;
			},
			error : () => {
				this.dialogRef.close();
			} 
		});
		
		this._photoSub = this.Media.photosOutput$.subscribe({
			next : (blob) => {
				this.photo.blob = blob;
				this.dialogRef.close(this.photo);
			}
		});
	}
	
	close(){
		this.dialogRef.close();
	}
	
	private _close(){
		this._streamSub.unsubscribe();
		this._photoSub.unsubscribe();
		this.Media.stopCameraFeed();
	}

}