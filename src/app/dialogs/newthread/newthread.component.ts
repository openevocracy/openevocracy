import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material';

@Component({
	selector: 'app-newthread',
	templateUrl: './newthread.component.html',
	styleUrls: ['./newthread.component.scss']
})
export class NewThreadDialogComponent implements OnInit {

	constructor(
		private dialogRef: MatDialogRef<NewThreadDialogComponent>) { }
	
	ngOnInit() {
	}
	
	private close() {
		this.dialogRef.close();
	}

}
