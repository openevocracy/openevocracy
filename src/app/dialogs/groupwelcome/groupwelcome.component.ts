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
		// This is added to avoid an ugly gui effect regarding mat-accordion
		// The timeout is necessary to avoid an error, see: https://blog.angular-university.io/angular-debugging/
		setTimeout(() => {
			this.showAdditional = true;
		}, 100);
	}
	
	public close() {
		this.dialogRef.close();
	}

}
