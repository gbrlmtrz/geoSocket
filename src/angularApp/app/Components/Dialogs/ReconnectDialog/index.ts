import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { LangService } from '@Services/lang.service';

@Component({
	selector: 'name-picker-dialog',
	templateUrl: 'layout.html',
	styleUrls: ['./style.css']
})
export class ReconnectDialog {

	reason : string;
	
	constructor(
		public Lang : LangService,
		public dialogRef: MatDialogRef<ReconnectDialog>,
		@Inject(MAT_DIALOG_DATA) public data) {
			
		this.reason = data.reason;
	}
	
	onClick(): void {
		this.dialogRef.close();
	}

}