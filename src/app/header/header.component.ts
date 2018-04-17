import { Component, OnInit } from '@angular/core';
//import { MatToolbarModule, MatListModule, MatMenuModule } from '@angular/material';
import { AppComponent } from '../app.component';

import { UserService } from '../_services/user.service';

import { faGlobe } from '@fortawesome/free-solid-svg-icons';
import { faCogs } from '@fortawesome/free-solid-svg-icons';

@Component({
	selector: 'app-header',
	templateUrl: './header.component.html',
	styleUrls: ['./header.component.scss']
})

export class HeaderComponent implements OnInit {
	
	private uid: string;
	
	private faGlobe = faGlobe;
	private faCogs = faCogs;
	
	constructor(
		private app: AppComponent,
		private userService: UserService) {
		this.uid = this.userService.getUserId();
	}
	
	ngOnInit() {}
	
	private setLanguage(key) {
		this.app.setLanguage(key);
	}
	
	private logout() {
		let self = this;
		
		// Call logout function in user service
		this.userService.logout();
	}
}
