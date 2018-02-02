import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';

import { TokenService } from '../_services/token.service';

@Injectable()
export class Guard implements CanActivate {
	
	constructor(public router: Router,
					public tokenService: TokenService) {}
	
	canActivate() {
		if(this.tokenService.isToken()) {
			// logged in so return true
			return true;
		}

		// not logged in so redirect to login page
		this.router.navigate(['/login']);
		return false;
	}
}