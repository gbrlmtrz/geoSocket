import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { LangService } from '@Services/lang.service';
import { Presentation } from '@Interfaces/Events/PresentationEvent';

@Component({
	selector: 'dial-dialog',
	templateUrl: 'layout.html',
	styleUrls: ['./style.css']
})
export class DialDialog {
	
	
	User : Presentation;
	isCallee : boolean;
	
	constructor(
		public Lang : LangService,
		public dialogRef: MatDialogRef<DialDialog>,
		@Inject(MAT_DIALOG_DATA) public data) {
		
		this.User = data.user;
		this.isCallee = data.isCallee;
	}
	
	onCancel(): void {
		this.dialogRef.close(false);
	}
	
	onAccept(): void {
		this.dialogRef.close(true);
	}

}