import { Component, Inject } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { LangService } from '@Services/lang.service';

@Component({
	selector: 'connecting-dialog',
	templateUrl: 'layout.html'
})
export class ConnectingDialog {

	constructor(
		public Lang : LangService,
		public dialogRef: MatDialogRef<ConnectingDialog>) {
			
	}
}