import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialogRef } from '@angular/material';

import { cfg } from '../../../../shared/config';

@Component({
	selector: 'app-share',
	templateUrl: './share.component.html',
	styleUrls: ['./share.component.scss']
})
export class ShareDialogComponent implements OnInit {

	private url: string;

	constructor(
		private router: Router,
		private dialogRef: MatDialogRef<ShareDialogComponent>
	) {
		// Get current URL
		this.url = cfg.BASE_URL + this.router.url;
	}
	
	ngOnInit() {}
	
	private close() {
		this.dialogRef.close();
	}

}
