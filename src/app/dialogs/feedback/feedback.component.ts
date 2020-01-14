import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material';

@Component({
	selector: 'dialog-feedback',
	templateUrl: './feedback.component.html',
	styleUrls: ['./feedback.component.scss']
})
export class FeedbackDialogComponent implements OnInit {

	public feedback: string;
	
	constructor(
		private dialogRef: MatDialogRef<FeedbackDialogComponent>) {}
	
	ngOnInit() {}
	
	public close() {
		this.dialogRef.close();
	}

}
