import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
	selector: 'dialog-groupwelcome',
	templateUrl: './groupwelcome.component.html',
	styleUrls: ['./groupwelcome.component.scss']
})
export class GroupWelcomeDialogComponent implements OnInit {
	
	constructor(
		private dialogRef: MatDialogRef<GroupWelcomeDialogComponent>,
		@Inject(MAT_DIALOG_DATA) public data
	) {}
	
	ngOnInit() {}
	
	public close() {
		this.dialogRef.close();
	}

}
