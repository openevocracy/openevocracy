import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';

import { UserService } from '../_services/user.service';

@Injectable()
export class Guard implements CanActivate {
	
	constructor(public router: Router,
					public user: UserService) {}
	
	canActivate() {
		let login = this.user.getLoginStatus();
		
		// If not logged in, redirect to any page
		if(!login)
			this.router.navigate(['/login']);
		
		// Return login status to allow secure routes or not
		return login;
	}
}