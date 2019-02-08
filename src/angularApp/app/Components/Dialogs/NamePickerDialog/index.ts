import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { LangService } from '@Services/lang.service';
import { Presentation } from '@Interfaces/Events/PresentationEvent';

interface NamePickerPayload{
	showCancel : boolean;
	user : Presentation;
}

@Component({
	selector: 'name-picker-dialog',
	templateUrl: 'layout.html',
	styleUrls: ['./style.css']
})
export class NamePickerDialog {

	colors : string[] = [
		"d50000",
		"f50057",
		"aa00ff",
		"ad1457",
		"6200ea",
		"303f9f",
		"0d47a1",
		"0091ea",
		"00838f",
		"00695c",
		"2e7d32",
		"558b2f",
		"827717",
		"f57f17",
		"ff8f00",
		"e65100",
		"f4511e",
		"3e2723",
		"263238"
	];

	pictures : string[] = [
		"001",
		"002",
		"003",
		"004",
		"005",
		"006",
		"007",
		"008",
		"009",
		"010",
		"011",
		"012",
		"013",
		"014",
		"015",
		"016",
		"017",
		"018",
		"019",
		"020",
		"021",
		"022",
		"023",
		"024",
		"025",
		"026",
		"027",
		"028",
		"029",
		"030",
		"031",
		"032",
		"033",
		"034",
		"035",
		"036",
		"037",
		"038",
		"039",
		"040",
		"041",
		"042",
		"043",
		"044",
		"045",
		"046",
		"047",
		"048",
		"049",
		"050"
	];

	User : Presentation;
	showCancel : boolean = true;
	
	constructor(
		public Lang : LangService,
		public dialogRef: MatDialogRef<NamePickerDialog>,
		@Inject(MAT_DIALOG_DATA) public data: NamePickerPayload) {
			
		this.User = data.user;
		this.showCancel = data.showCancel;
			
	}
	
	onSubmit(f){
		this.dialogRef.close(this.User);
	}
	
	onNoClick(): void {
		this.dialogRef.close();
	}

}