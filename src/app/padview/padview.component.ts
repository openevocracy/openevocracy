import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { HttpManagerService } from '../_services/http-manager.service';

import { faEllipsisV, faUser, faShareSquare, faComments } from '@fortawesome/free-solid-svg-icons';

@Component({
	selector: 'app-padview',
	templateUrl: './padview.component.html',
	styleUrls: ['./padview.component.scss']
})

export class PadviewComponent implements OnInit {

	private pad;
	private now;

	// FontAwesome icons
	private faEllipsisV = faEllipsisV;
	private faUser = faUser;
	private faShareSquare = faShareSquare;
	private faComments = faComments;

	constructor(
		private router: Router,
		private httpManagerService: HttpManagerService
	) { }
	
	ngOnInit() {
		this.httpManagerService.get('/json' + this.router.url).subscribe(res => {
			this.pad = res;
			this.now = Date.now();
		});
	}

}
