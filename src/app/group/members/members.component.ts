import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { HttpManagerService } from '../../_services/http-manager.service';

@Component({
	selector: 'app-members',
	templateUrl: './members.component.html',
	styleUrls: ['../group.component.scss', './members.component.scss']
})
export class GroupMembersComponent implements OnInit {

	public members;
	public isLastGroup;

	constructor(
		private router: Router,
		private httpManagerService: HttpManagerService
	) { }
	
	ngOnInit() {
		// Get current groupId
		const groupId = this.router.url.split('/')[2];
		
		// Get members
		this.httpManagerService.get('/json/group/members/' + groupId).subscribe((res) => {
			
			this.members = res.members;
			this.isLastGroup = res.isLastGroup;
			
			console.log(res);
		});
	}

}
