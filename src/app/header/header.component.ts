import { Component, OnInit } from '@angular/core';
//import { MatToolbarModule, MatListModule, MatMenuModule } from '@angular/material';
import { AppComponent } from '../app.component';
import { Router, RouterLinkActive } from '@angular/router';

import { UserService } from '../_services/user.service';

@Component({
	selector: 'app-header',
	templateUrl: './header.component.html',
	styleUrls: ['./header.component.scss']
})

export class HeaderComponent implements OnInit {
	
	constructor(
		private app: AppComponent,
		private router: Router,
		private user: UserService) { }
	
	ngOnInit() {}
	
	setLanguage(key) {
		this.app.setLanguage(key);
	}
	
	logout() {
		let self = this;
		
		// Call logout function in user service
		this.user.logout().subscribe(res => {
			// Redirect to any page after logout was successful
			self.router.navigate(['/login']);
		});
	}
}
