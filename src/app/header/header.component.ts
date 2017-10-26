import { Router, RouterLinkActive } from '@angular/router';
import { Component, OnInit } from '@angular/core';
//import { MatToolbarModule, MatListModule, MatMenuModule } from '@angular/material';

import { AppComponent } from '../app.component';

import { UserService } from '../_services/user.service';

@Component({
	selector: 'app-header',
	templateUrl: './header.component.html',
	styleUrls: ['./header.component.scss']
})

export class HeaderComponent implements OnInit {
	
	constructor(public app: AppComponent,
				public router: Router,
				public user: UserService) { }
	
	ngOnInit() {}
	
	setLanguage(key) {
		this.app.setLanguage(key);
	}
	
	logout() {
		// Set login status to false (logout)
		this.user.setLoginStatus(false);
		
		// Redirect to any page after logout
		this.router.navigate(['/login']);
	}
}
