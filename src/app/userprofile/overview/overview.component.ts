import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
	selector: 'app-overview',
	templateUrl: './overview.component.html',
	styleUrls: ['./overview.component.scss']
})
export class UserprofileOverviewComponent implements OnInit {
	
	public profileId: string;

	constructor(private router: Router) {
		this.profileId = this.router.url.split('/')[3];
	}
	
	ngOnInit() {
	}

}
