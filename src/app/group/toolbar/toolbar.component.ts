import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Params, Router, Event, NavigationStart, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';

import { ModalService } from '../../_services/modal.service';
import { CloseeditorModalService } from '../../_services/modal.closeeditor.service';
import { HttpManagerService } from '../../_services/http-manager.service';
import { UserService } from '../../_services/user.service';
import { ConnectionAliveService } from '../../_services/connection.service';
import { EditorService } from '../../_services/editor.service';

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
	
	public activeTab: string = 'editor';
	public userToken;
	public groupId: string;
	public title: string;
	public topicId: string;
	public padId: string;
	public expiration: number;
	public badgeSocket;
	public modalSubscription: Subscription;
	
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
		private closeeditorModalService: CloseeditorModalService,
		private modalService: ModalService,
		private editorService: EditorService
	) {
		// Get user token and userId from user service
		this.userToken = this.userService.getToken();
		
		// Get groupId
		this.groupId = this.router.url.split('/')[2];
		
		// Listen to route changes
		this.router.events.subscribe((event: Event) => {
			// If navigation starts, contains source route
			if (event instanceof NavigationStart) {
				// Clear badges database value
				this.clearBadgeDatabase();
         }
			
			// If navigation has finished, contains target route
			if (event instanceof NavigationEnd) {
				// Get current path and define active tab
				this.activeTab = this.router.url.split('/')[3];
				// Clear badges view
				this.clearBadgeView();
         }
		});
		
		// If modal response confirms closing, navigate to topic
		this.modalSubscription = this.closeeditorModalService.getResponse().subscribe((close) => {
			// Close modal
			this.modalService.close();
			
			// Navigate to source
			if (close)
				this.router.navigate(['/topic', this.topicId]);
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
			this.initBadgeSocket();
		});
	}
	
	ngOnInit() {
		// Get data for toolbar from server
			this.httpManagerService.get('/json/group/toolbar/' + this.groupId).subscribe(res => {
			// Define title, id and expiration
			this.title = '(' + res.groupName + ') ' + res.topicTitle;
			this.topicId = res.topicId;
			this.padId = res.padId;
			this.expiration = res.expiration;
			
			// Update badges in toolbar
			this.updateBadge(res.badge);
			
			// Init badge socket connection
			this.initBadgeSocket();
		});
	}
	
	ngOnDestroy() {
		// Clear badges database value
		this.clearBadgeDatabase();
		
		// Unsubscribe to avoid memory leak
		this.modalSubscription.unsubscribe();
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
	private closeGroup() {
		// Check if document is saved to avoid loss of data
		// Note that if isSaved is undefined, just close the group, in that case the editor does not already or not anymore exist
		const isSaved = this.editorService.isSaved(this.padId)
		if (!_.isUndefined(isSaved) && !isSaved) {
			// If it is not saved, open modal with warning
			this.modalService.open({});
			return;
		}
		
		// Navigate to topic
		this.router.navigate(['/topic', this.topicId]);
	}

}
