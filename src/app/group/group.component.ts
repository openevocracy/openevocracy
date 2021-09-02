import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { MatDialog } from "@angular/material";
import { ActivatedRoute } from '@angular/router';

import { GroupWelcomeDialogComponent } from '../dialogs/groupwelcome/groupwelcome.component';

import { StageUpdateService } from '../_services/stageupdate.service';
import { HttpManagerService } from '../_services/http-manager.service';
import { UserService } from '../_services/user.service';
import { GroupService } from '../_services/group.service';

import { BasicGroup } from '../_models/group/basic-group';

import * as _ from 'underscore';

@Component({
	selector: 'app-group',
	templateUrl: './group.component.html',
	styleUrls: ['./group.component.scss']
})
export class GroupComponent implements OnInit, OnDestroy {

	public meId: string;
	public groupId: string;
	public group: BasicGroup;
	public deadlineInterval: number;
	public routerSubscription: any;

	constructor(
		private dialog: MatDialog,
		private router: Router,
		private userService: UserService,
		private groupService: GroupService,
		private httpManagerService: HttpManagerService,
		private route: ActivatedRoute,
		private stageUpdateService: StageUpdateService
	) {
		// Get userId of logged in user and groupId
		this.meId = this.userService.getUserId();
		this.groupId = this.router.url.split('/')[2];
		
		// Get group from resolver
		this.group = new BasicGroup(this.route.snapshot.data.basicGroup);
		//this.group = this.groupService.getBasicGroupFromCache(this.groupId);
			
		// Initialize stage update countdown
		this.deadlineInterval = this.stageUpdateService.initCountdown(
			this.group.expiration,
			['/group', this.groupId]
		);
	}
	
	ngOnInit() {
		// If user is member (if me is truthy), check welcome status and possibly show welcome message
		if (this.group.isMember(this.meId))
			this.checkWelcomeStatus();
	}
	
	ngOnDestroy() {
   	// Unsubscribe from subscription to avoid memory leak
		if (this.routerSubscription)
			this.routerSubscription.unsubscribe();
			
		// Stop countdown
		if (this.deadlineInterval)
			clearInterval(this.deadlineInterval);
	}
	
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
