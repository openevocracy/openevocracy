import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog } from "@angular/material";

import { Thread } from "../../_models/forum/thread";

import { EditThreadDialogComponent } from '../../dialogs/editthread/editthread.component';

import { UtilsService } from '../../_services/utils.service';
import { HttpManagerService } from '../../_services/http-manager.service';
import { UserService } from '../../_services/user.service';
import { SnackbarService } from '../../_services/snackbar.service';
import { GroupService } from '../../_services/group.service';

import { faPlusSquare, faUsers, faLock } from '@fortawesome/free-solid-svg-icons';

import * as _ from 'underscore';

@Component({
	selector: 'app-groupforum',
	templateUrl: './forum.component.html',
	styleUrls: ['../group.component.scss', './forum.component.scss'],
	encapsulation: ViewEncapsulation.None
})
export class GroupForumComponent implements OnInit {
	
	public userId: string;
	public forumId: string;
	public groupId: string;
	public isExpired: boolean = true;
	public notifyStatus: boolean = false;
	public threads: Thread[];
	
	// FontAwesome icons
	public faPlusSquare = faPlusSquare;
	public faUsers = faUsers;
	public faLock = faLock;

	constructor(
		private router: Router,
		private utilsService: UtilsService,
		private activatedRoute: ActivatedRoute,
		private httpManagerService: HttpManagerService,
		private translateService: TranslateService,
		private matDialog: MatDialog,
		private userService: UserService,
		private groupService: GroupService,
		private snackbarService: SnackbarService
	) {
			
		// Store user id of current user
		this.userId = this.userService.getUserId();
	}
	
	ngOnInit() {
		// Get current groupId
		this.groupId = this.router.url.split('/')[2];
		
		// Get group from group service cache
		const group = this.groupService.getBasicGroupFromCache(this.groupId);
		this.isExpired = group.isExpired;
		
		// Get current forum information
		this.httpManagerService.get('/json/group/forum/' + this.groupId).subscribe(res => {
			this.forumId = res.forumId;
			this.notifyStatus = res.notifyStatus;
			
			// Initialize thread and construct all elements
			this.threads = [];
			_.each(res.threads, function(thread) {
				this.threads.push(new Thread(thread));
			}.bind(this));
			
			// Sort threads by last activity (either last response or creation time)
			this.threads = _.sortBy(this.threads, 'lastActivityTimestamp').reverse();
		});
	}
	
	/**
	 * @desc: Opens dialog to add new thread and subscribe to dialog
	 *        function is called from "New thread"-Button
	 */
	public openNewThreadDialog() {
		// Open dialog
		const dialogRef = this.matDialog.open(EditThreadDialogComponent, { 'minWidth': '600px' });
		// Wait for onSubmit event from dialog
		dialogRef.componentInstance.onSubmit.subscribe(thread => {
			this.onSubmit(thread);
		});
	}
	
	/**
	 * @desc: When a new thread is submitted from dialog, the new thread will be postet to server
	 */
	private onSubmit(thread) {
		// Extend thread information, coming from dialog
		const data = _.extend(thread, { 'forumId': this.forumId });
		// Post thread to server and create thread in database
		this.httpManagerService.post('/json/group/forum/thread/create', data).subscribe(res => {
			
			// Add new thread to beginning of threads array
			this.threads.unshift(new Thread(res.thread.ops[0]));
			
			// Show snackbar notification
			this.snackbarService.showSnackbar('FORUM_SNACKBAR_NEW_THREAD');
		});
	}
	
	/**
	 * @desc: Changes the status of e-mail notifications
	 */
	public changeNotifyStatus(e) {
		const data = {
			'userId': this.userId,
			'entityId': this.forumId,
			'status': e.checked
		};
		
		// Post notify status to server
		this.httpManagerService.post('/json/notify', data).subscribe(res => {
			// Snackbar notification
			if (e.checked)
				this.snackbarService.showSnackbar('FORUM_EMAIL_NOTIFY_STATUS_ON');
			else
				this.snackbarService.showSnackbar('FORUM_EMAIL_NOTIFY_STATUS_OFF');
		});
	}

}
