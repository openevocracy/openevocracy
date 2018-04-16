import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';

import { UserService } from '../_services/user.service';

@Injectable()
export class Guard implements CanActivate {
	
	constructor(public router: Router,
					public userService: UserService) {}
	
	canActivate() {
		// If logged in so return true
		if(this.userService.hasToken())
			return true;

		// Not logged in so redirect to login page
		this.router.navigate(['/login']);
		return false;
	}
}