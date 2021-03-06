import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Params, Router, Event, NavigationStart, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';
import { MatDialog } from '@angular/material';

import { HttpManagerService } from '../../_services/http-manager.service';
import { UserService } from '../../_services/user.service';
import { GroupService } from '../../_services/group.service';
import { ConnectionAliveService } from '../../_services/connection.service';
import { EditorService } from '../../_editor/editor.service';

import { CloseEditorDialogComponent } from '../../dialogs/closeeditor/closeeditor.component';

import * as parseUrl from 'url-parse';
import * as origin from 'get-location-origin';
import * as _ from 'underscore';

import { faTimes, faExpandArrowsAlt, faComments, faUsers, faFile } from '@fortawesome/free-solid-svg-icons';

@Component({
	selector: 'group-toolbar',
	templateUrl: './toolbar.component.html',
	styleUrls: ['./toolbar.component.scss']
})
export class GroupToolbarComponent implements OnInit, OnDestroy {
	
	public isMember: boolean = false;
	public isExpired: boolean = true;
	
	public activeTab: string = 'editor';
	public userToken;
	public userId: string;
	public groupId: string;
	public title: string;
	public topicId: string;
	public padId: string;
	public expiration: number;
	public badgeSocket;
	
	public editorBadge: number;
	public chatBadge: number;
	public forumBadge: number;
	public membersBadge: number;
  
	public faExpandArrowsAlt = faExpandArrowsAlt;
	public faComments = faComments;
	public faTimes = faTimes;
	public faUsers = faUsers;
	public faFile = faFile;
	
	constructor(
		private router: Router,
		private userService: UserService,
		private activatedRoute: ActivatedRoute,
		private httpManagerService: HttpManagerService,
		private connectionAliveService: ConnectionAliveService,
		private editorService: EditorService,
		private groupService: GroupService,
		private dialog: MatDialog
	) {
		// Get user token and userId from user service
		this.userToken = this.userService.getToken();
		this.userId = this.userService.getUserId();
		
		// Get groupId
		this.groupId = this.router.url.split('/')[2];
		
		// Listen to route changes
		this.router.events.subscribe((event: Event) => {
			// If navigation starts, contains source route
			if (event instanceof NavigationStart) {
				// Clear badges database value
				if (this.badgeSocket)
					this.clearBadgeDatabase();
         }
			
			// If navigation has finished, contains target route
			if (event instanceof NavigationEnd) {
				// Get current path and define active tab
				this.activeTab = this.router.url.split('/')[3];
				// Clear badges view
				if (this.badgeSocket)
					this.clearBadgeView();
         }
		});
		
		// Listen to connection lost event
		this.connectionAliveService.connectionLost.subscribe((res) => {
			// If connection is lost, close pad socket connection
			if (this.badgeSocket)
				this.badgeSocket.close();
		});
		
		// Listen to connection reconnected event
		this.connectionAliveService.connectionReconnected.subscribe((res) => {
			// If connection is lost, reconnect pad socket
			if(this.isMember && !this.isExpired)
				this.initBadgeSocket();
		});
	}
	
	ngOnInit() {
		// Get group from group service cache
		const group = this.groupService.getBasicGroupFromCache(this.groupId);
		
		// Define title, id and expiration
		this.title = '(' + group.groupName + ' | ' + group.groupCode + ') ' + group.topicName;
		this.topicId = group.topicId;
		this.padId = group.padId;
		this.expiration = group.expiration;
		this.isExpired = group.isExpired;
		
		this.isMember = group.isMember(this.userId);
		
		if(this.isMember && !this.isExpired)
			this.getBadgesFromServerAndInitSocket();
	}
	
	ngOnDestroy() {
		// Clear badges database value
		if (this.badgeSocket)
			this.clearBadgeDatabase();
	}
	
	/**
	 * @desc: Get badge information from server, finally initialize badge socket
	 */
	private getBadgesFromServerAndInitSocket() {
		// Get data for toolbar from server
		this.httpManagerService.get('/json/group/badges/' + this.groupId).subscribe(badge => {
			// Update badges in toolbar
			this.updateBadge(badge);
			// Init badge socket connection
			this.initBadgeSocket();
		});
	}
	
	/**
	 * @desc: Initialize badge socket
	 */
	private initBadgeSocket() {
		// Open WebSocket connection
		const parsed = parseUrl(origin);
		const protocol = parsed.protocol.includes('https') ? 'wss://' : 'ws://';
		this.badgeSocket = new WebSocket(protocol + parsed.host + '/socket/badge/'+this.groupId+'/'+this.userToken);
		
		// WebSocket connection is established
		this.badgeSocket.onopen = (event) => {
			console.log('onopen', event);
		};
		
		// New Websocket message comes in
		this.badgeSocket.onmessage = (event) => {
			console.log('onmessage', event);
			
			// Parse message from server
			var msg = JSON.parse(event.data);
			
			// Update badges in toolbar
			this.updateBadge(msg);
		};
		
		// WebSocket connection was closed from server
		this.badgeSocket.onerror = (err) => {
			console.log('onerror', err);
		};
		
		// WebSocket connection was closed from server
		this.badgeSocket.onclose = (event) => {
			console.log('onclose', event);
		};
	}
	
	/**
	 * @desc: Update badge value in view
	 */
	private updateBadge(el) {
		if (el.hasOwnProperty('editorUnseen') && this.activeTab != 'editor')
			this.editorBadge = (el.editorUnseen == 0) ? null : el.editorUnseen;
			
		if (el.hasOwnProperty('chatUnseen') && this.activeTab != 'chat')
			this.chatBadge = (el.chatUnseen == 0) ? null : el.chatUnseen;
			
		if (el.hasOwnProperty('forumUnseen') && this.activeTab != 'forum')
			this.forumBadge = (el.forumUnseen == 0) ? null : el.forumUnseen;
			
		if (el.hasOwnProperty('membersUnseen') && this.activeTab != 'members')
			this.membersBadge = (el.membersUnseen == 0) ? null : el.membersUnseen;
	}
	
	/**
	 * @desc: Clear badge view of the tab wich was just opend
	 */
	private clearBadgeView() {
		switch(this.activeTab) {
			case 'editor':
				this.editorBadge = null;
			break;
			case 'chat':
				this.chatBadge = null;
			break;
			case 'forum':
				this.forumBadge = null;
			break;
			case 'members':
				this.membersBadge = null;
			break;
		}
	}
	
	/**
	 * @desc: Clear badge database state of the tab wich was just opend
	 */
	private clearBadgeDatabase() {
		// Send tab string to server which was seen by the user
		this.badgeSocket.send(this.activeTab);
	}

	/**
	 * @desc: Closes the group
	 */
	public closeGroup() {
		// Check if document is saved to avoid loss of data
		// Note that if isSaved is undefined, just close the group, in that case the editor does not already or not anymore exist
		const isSaved = this.editorService.isSaved(this.padId)
		if (_.isUndefined(isSaved) || isSaved) {
			// Navigate to topic
			this.router.navigate(['/topic', this.topicId]);
			return;
		}
		
		// If editor is not fully saved, redirect open dialog and ask if user really wants to close the editor
		const dialogRef = this.dialog.open(CloseEditorDialogComponent, { 'minWidth': '300px' });
		
		// Subscribe to response from dialog
		dialogRef.componentInstance.onSubmit.subscribe((res) => {
			// If user really wants to leave, navigate to source
			if (res.isLeave)
				this.router.navigate(['/topic', this.topicId]);
   	});
		
	}

}
