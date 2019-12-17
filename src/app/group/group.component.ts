import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { MatDialog } from "@angular/material";
import { ActivatedRoute } from '@angular/router';

import { GroupWelcomeDialogComponent } from '../dialogs/groupwelcome/groupwelcome.component';

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
	
	public routerSubscription: any;

	constructor(
		private dialog: MatDialog,
		private router: Router,
		private userService: UserService,
		private groupService: GroupService,
		private httpManagerService: HttpManagerService,
		private route: ActivatedRoute
	) {
		// Get userId of logged in user and groupId
		this.meId = this.userService.getUserId();
		this.groupId = this.router.url.split('/')[2];
	}
	
	ngOnInit() {
		// Get group from resolver
		const group = new BasicGroup(this.route.snapshot.data.basicGroup);
			
		// If user is member (if me is truthy), check welcome status and possibly show welcome message
		if (group.isMember(this.meId))
			this.checkWelcomeStatus();
		
		// Allow reload of the whole component
		this.router.routeReuseStrategy.shouldReuseRoute = function () {
			return false;
		};
		
		this.routerSubscription = this.router.events.subscribe((event) => {
			if (event instanceof NavigationEnd) {
				// Trick the Router into believing it's last link wasn't previously loaded
				this.router.navigated = false;
			}
		});
	}
	
	ngOnDestroy() {
   	// Unsubscribe from subscription to avoid memory leak
		if (this.routerSubscription)
			this.routerSubscription.unsubscribe();
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
