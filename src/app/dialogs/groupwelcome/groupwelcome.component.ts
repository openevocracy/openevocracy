import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
	selector: 'dialog-groupwelcome',
	templateUrl: './groupwelcome.component.html',
	styleUrls: ['./groupwelcome.component.scss']
})
export class GroupWelcomeDialogComponent {
	
	public showAdditional: boolean = false;
	
	constructor(
		private dialogRef: MatDialogRef<GroupWelcomeDialogComponent>,
		@Inject(MAT_DIALOG_DATA) public data
	) {}
	
	public ngAfterViewChecked() {
		this.showAdditional = true;
	}
	
	public close() {
		this.dialogRef.close();
	}

}
