import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material';

@Component({
	selector: 'app-feedback',
	templateUrl: './feedback.component.html',
	styleUrls: ['./feedback.component.scss']
})
export class FeedbackDialogComponent implements OnInit {

	feedback: string;
	
	constructor(
		private dialogRef: MatDialogRef<FeedbackDialogComponent>) {}
	
	ngOnInit() {}
	
	close() {
		this.dialogRef.close();
	}

}
