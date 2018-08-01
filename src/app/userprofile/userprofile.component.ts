import { Component, OnInit } from '@angular/core';

import { HttpManagerService } from '../_services/http-manager.service';
import { UserService } from '../_services/user.service';

@Component({
	selector: 'app-userprofile',
	templateUrl: './userprofile.component.html',
	styleUrls: ['./userprofile.component.scss']
})
export class UserprofileComponent implements OnInit {

	private userId: string;

	constructor(
		private userService: UserService,
		private httpManagerService: HttpManagerService
	) {
		let userId = this.userService.getUserId();
		console.log(userId);
		this.httpManagerService.get('/json/user/profile/'+userId).subscribe(res => {
			// TODO currently only userId is contained in result, which is just to have a start,
			// it is intended to add more data later
			this.userId = res._id;
		});
	}
	
	ngOnInit() {
		
	}

}
