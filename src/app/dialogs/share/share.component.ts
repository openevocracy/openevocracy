import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material';

@Component({
	selector: 'app-share',
	templateUrl: './share.component.html',
	styleUrls: ['./share.component.scss']
})
export class ShareDialogComponent implements OnInit {
	public url: string;

	constructor(
		private dialogRef: MatDialogRef<ShareDialogComponent>) {
			
		// Get current URL
		this.url = window.location.href ;
	}
	
	ngOnInit() {}
	
	public close() {
		this.dialogRef.close();
	}

}
