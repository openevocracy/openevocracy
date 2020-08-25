import { Component, OnInit } from '@angular/core';
import { Router, Event, NavigationEnd } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';
import { UserService } from '../_services/user.service';

import * as _ from 'underscore';
import { faFire, faUser } from '@fortawesome/free-solid-svg-icons';

@Component({
	selector: 'app-user',
	templateUrl: './user.component.html',
	styleUrls: ['./user.component.scss']
})
export class UserComponent implements OnInit {

	public userId: string;
	public profileId: string;
	public header: string;
	
	public activeTab: string = 'overview';
	
	public faUser = faUser;
	public faFire = faFire;

	constructor(
		private userService: UserService,
		private router: Router,
		private translate: TranslateService
	) {
		// Get get user and profile id
		this.userId = this.userService.getUserId();
		this.profileId = this.router.url.split('/')[2];
			
		// Choose appropriate headline
		// Headline for viewing own profile
		if (this.userId == this.profileId) {
			this.translate.get("HEADER_MAINMENU_MY_PROFILE").
				subscribe(str => { this.header = str; });
		}
		// Headline for viewing another user's profile
		else {
			this.translate.get("HEADER_MAINMENU_USER_PROFILE").
				subscribe(str => { this.header = str; });
		}
		
		// Listen to route changes
		this.router.events.subscribe((event: Event) => {			
			// If navigation has finished
			if (event instanceof NavigationEnd) {
				// Get current path and define active tab
				this.activeTab = this.router.url.split('/')[4];
         }
		});
	}
	
	ngOnInit() {

	}
}
