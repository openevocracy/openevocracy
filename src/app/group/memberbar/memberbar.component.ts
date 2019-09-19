import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { HttpManagerService } from '../../_services/http-manager.service';
import { UserService } from '../../_services/user.service';

import { Member } from '../../_models/group/memberbar';

import { faUser } from '@fortawesome/free-solid-svg-icons';
import * as _ from 'underscore';

@Component({
	selector: 'memberbar',
	templateUrl: './memberbar.component.html',
	styleUrls: ['./memberbar.component.scss']
})
export class GroupMemberbarComponent implements OnInit {
	
	public userId;
	public groupMembers: Member[] = [];
	public online = {};
	public onlineInterval;
	
	public faUser = faUser;

	constructor(
		private router: Router,
		private userService: UserService,
		private httpManagerService: HttpManagerService
	) {
		this.userId = this.userService.getUserId();
	}
	
	ngOnInit() {
		// Get current groupId
		const groupId = this.router.url.split('/')[2];
		
		// Get data about members
		this.httpManagerService.get('/json/group/memberbar/' + groupId).subscribe(res => {
			// Create objects for every member
			_.each(res, (member) => {
				this.groupMembers.push(new Member(member));
			});
		});
		
		// Call online members every minute
		this.onlineInterval = setInterval(() => {
			this.httpManagerService.get('/json/group/membersonline/' + groupId).subscribe(res => {
				// Update isOnline status of group members
				_.each(res, (user) => {
					let member = _.findWhere(this.groupMembers, { 'userId': user.userId })
					member.isOnline = user.isOnline;
				});
			});
		}, 60000);
	}

}
