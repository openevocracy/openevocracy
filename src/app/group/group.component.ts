import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from "@angular/material";

import { GroupWelcomeDialogComponent } from '../dialogs/groupwelcome/groupwelcome.component';

import { HttpManagerService } from '../_services/http-manager.service';
import { UserService } from '../_services/user.service';
import { GroupService } from '../_services/group.service';

import * as _ from 'underscore';

@Component({
	selector: 'app-group',
	templateUrl: './group.component.html',
	styleUrls: ['./group.component.scss']
})
export class GroupComponent implements OnInit {

	public userId: string;
	public groupId: string;

	constructor(
		private dialog: MatDialog,
		private router: Router,
		private userService: UserService,
		private groupService: GroupService,
		private httpManagerService: HttpManagerService
	) {
		// Get current userId and groupId
		this.userId = this.userService.getUserId();
		this.groupId = this.router.url.split('/')[2];
		
		// Get basic information about group and evaluate user status
		this.groupService.getBasicGroupAsync(this.groupId).subscribe((group) => {
			const me = _.findWhere(group.members, { 'userId': this.userId });
			
			// If user is member (if me is truthy), check welcome status and possibly show welcome message
			if (me)
				this.checkWelcomeStatus();
		});
	}
	
	ngOnInit() {}
	
	/**
	 * @desc: Check if welcome status was not already shown, if not, show it
	 */
	private checkWelcomeStatus() {
		// TODO Check if welcome dialog shall be opened
		this.httpManagerService.get('/json/group/welcome/status/'+this.groupId).subscribe((res) => {
			// If welcome dialog was alread shown, stop here
			if (res.alreadyShown)
				return;
			
			// If welcome dialog was not already shown, show dialog
			this.openWelcomeDialog();
		});
	}

	/**
	 * @desc: Opens welcome dialog if group is opend for the first time, if user has not deactivated it
	 */
	private openWelcomeDialog() {
		// Get information from server for dialog
		this.httpManagerService.get('/json/group/welcome/'+this.groupId).subscribe((res) => {
			const options = { 'data': res, 'minWidth': '500px', 'maxWidth': '600px' };
			const dialogRef = this.dialog.open(GroupWelcomeDialogComponent, options);
			
			dialogRef.afterClosed().subscribe(result => {
				// Update welcome status, such that welcome dialog does not show up next time opening the group
				const data = { 'groupId': this.groupId };
				this.httpManagerService.post('/json/group/welcome/status', data).subscribe();
	   	});
		});
	}
}
