import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialogRef } from '@angular/material';

import { ConfigService } from '../../_services/config.service';

@Component({
	selector: 'app-share',
	templateUrl: './share.component.html',
	styleUrls: ['./share.component.scss']
})
export class ShareDialogComponent implements OnInit {
	public url: string;

	constructor(
		private router: Router,
		private dialogRef: MatDialogRef<ShareDialogComponent>,
		private configService: ConfigService) {
		const cfg = configService.get();
			
		// Get current URL
		this.url = cfg.BASE_URL + this.router.url;
	}
	
	ngOnInit() {}
	
	public close() {
		this.dialogRef.close();
	}

}
