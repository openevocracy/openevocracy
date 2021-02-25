import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

import { HttpManagerService } from '../../_services/http-manager.service';
import { GroupService } from '../../_services/group.service';
import { UserService } from '../../_services/user.service';

import { Member } from '../../_models/group/memberbar';

import { faUser, faFile } from '@fortawesome/free-solid-svg-icons';

import * as _ from 'underscore';

@Component({
	selector: 'memberbar',
	templateUrl: './memberbar.component.html',
	styleUrls: ['./memberbar.component.scss']
})
export class GroupMemberbarComponent implements OnInit, OnDestroy {
	
	public userId;
	public groupMembers: Member[] = [];
	public onlineInterval;
	public groupId;
	
	public faUser = faUser;
	public faFile = faFile;

	constructor(
		private router: Router,
		private userService: UserService,
		private groupService: GroupService,
		private httpManagerService: HttpManagerService
	) {
		this.userId = this.userService.getUserId();
	}
	
	ngOnInit() {
		// Get current groupId
		this.groupId = this.router.url.split('/')[2];
		
		// Get group from group service cache
		const group = this.groupService.getBasicGroupFromCache(this.groupId);
		
		// Get member online status for the first time
		this.httpManagerService.get('/json/group/membersonline/' + this.groupId).subscribe(membersOnlineStatus => {
			_.each(group.members, (member) => {
				// Find current member in online status array
				const foundMember = _.findWhere(membersOnlineStatus, { 'userId': member.userId });
				// Add online status to member array from groups
				member.isOnline = foundMember.isOnline;
				// Create member object and add to group members
				this.groupMembers.push(new Member(member));
			});
		});
		
		// Call online members every minute
		this.onlineInterval = setInterval(() => {
			this.httpManagerService.get('/json/group/membersonline/' + this.groupId).subscribe(membersOnlineStatus => {
				// Update isOnline status of group members
				_.each(this.groupMembers, (member) => {
					const foundMember = _.findWhere(membersOnlineStatus, { 'userId': member.userId })
					member.isOnline = foundMember.isOnline;
				});
			});
		}, 60000);
	}
	
	ngOnDestroy() {
		clearInterval(this.onlineInterval);
	}

}
