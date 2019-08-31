import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog } from "@angular/material";

import { Thread } from "../_models/forum/thread";

import { EditThreadDialogComponent } from '../dialogs/editthread/editthread.component';

import { UtilsService } from '../_services/utils.service';
import { HttpManagerService } from '../_services/http-manager.service';
import { UserService } from '../_services/user.service';
import { SnackbarService } from '../_services/snackbar.service';

import { faComment, faUsers, faLock } from '@fortawesome/free-solid-svg-icons';

import * as _ from 'underscore';

@Component({
	selector: 'app-groupforum',
	templateUrl: './groupforum.component.html',
	styleUrls: ['./groupforum.component.scss'],
	encapsulation: ViewEncapsulation.None
})
export class GroupForumComponent implements OnInit {
	
	public userId: string;
	public forumId: string;
	public padId: string;
	public prefix: string;
	public title: string;
	public notifyStatus: boolean = false;
	public threads: Thread[];
	
	// FontAwesome icons
	public faComment = faComment;
	public faUsers = faUsers;
	public faLock = faLock;

	constructor(
		private utilsService: UtilsService,
		private activatedRoute: ActivatedRoute,
		private httpManagerService: HttpManagerService,
		private translateService: TranslateService,
		private matDialog: MatDialog,
		private userService: UserService,
		private snackbarService: SnackbarService) {
			
		// Store user id of current user
		this.userId = this.userService.getUserId();
	}
	
	ngOnInit() {
		// Get forum id from url
		this.activatedRoute.params.subscribe((params: Params) => {
			this.forumId = params.id;
			
			// Get current forum information
			this.httpManagerService.get('/json/group/forum/' + this.forumId).subscribe(res => {
				this.padId = res.padId;
				this.title = res.title;
				this.notifyStatus = res.notifyStatus;
				
				// Initialize thread and construct all elements
				this.threads = [];
				_.each(res.threads, function(thread) {
					this.threads.push(new Thread(thread));
				}.bind(this));
				
				// Sort threads by last activity (either last response or creation time)
				this.threads = _.sortBy(this.threads, 'lastActivityTimestamp').reverse();
				
				// Set pre title
				const shortGroupId = this.utilsService.getShortId(res.groupId);
				this.translateService.get('FORUM_TITLE_PREFIX', {'id': shortGroupId}).subscribe(label => {
					this.prefix = label;
				});
			});
		});
	}
	
	/*
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
	
	/*
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
