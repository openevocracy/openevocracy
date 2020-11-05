import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router"

import { UserService } from '../_services/user.service';

@Component({
	selector: 'app-public',
	templateUrl: './public.component.html',
	styleUrls: ['./public.component.css']
})
export class PublicComponent implements OnInit {

	constructor(
		private userService: UserService,
		private router: Router
	) {
		// Check if user is already logged in and redirect to home if this is the case
		const loggedInUser = userService.getUser();
		if (loggedInUser) {
			// Redirect user to secure home page
			this.router.navigate(['/topiclist']);
		}
	}
	
	ngOnInit() {
		
	}

}
