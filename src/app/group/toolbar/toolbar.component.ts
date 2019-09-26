import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router, Event, NavigationEnd } from '@angular/router';

import { HttpManagerService } from '../../_services/http-manager.service';
import { UserService } from '../../_services/user.service';

import * as parseUrl from 'url-parse';
import * as origin from 'get-location-origin';

import { faTimes, faExpandArrowsAlt, faComments, faUsers, faFile } from '@fortawesome/free-solid-svg-icons';

@Component({
	selector: 'group-toolbar',
	templateUrl: './toolbar.component.html',
	styleUrls: ['./toolbar.component.scss']
})
export class GroupToolbarComponent implements OnInit {
	
	public activeTab: string = 'editor';
	public userToken;
	public groupId: string;
	public title: string;
	public expiration: number;
	public badgeSocket;
	
	public editorBadge: string = '.';
  
	public faExpandArrowsAlt = faExpandArrowsAlt;
	public faComments = faComments;
	public faTimes = faTimes;
	public faUsers = faUsers;
	public faFile = faFile;
	
	constructor(
		private router: Router,
		private userService: UserService,
		private activatedRoute: ActivatedRoute,
		private httpManagerService: HttpManagerService
	) {
		// Get user token and userId from user service
		this.userToken = this.userService.getToken();
		
		// Listen to route changes
		this.router.events.subscribe((event: Event) => {
			// If navigation has finished
			if (event instanceof NavigationEnd) {
				// Get current path and define active tab
				this.activeTab = this.router.url.split('/')[3];
				// Clear badges, depending on current tab
				this.clearBadge();
         }
		});
	}
	
	ngOnInit() {
		this.activatedRoute.params.subscribe((params: Params) => {
			// Get group id from url
			this.groupId = params.id;
			
			// Get data for toolbar from server
			this.httpManagerService.get('/json/group/toolbar/' + this.groupId).subscribe(res => {
				// Define title
				this.title = '(' + res.groupName + ') ' + res.topicTitle;
				
				// Define expiration
				this.expiration = res.expiration;
				
				// Get current badge status
				//console.log(res.badge);
				
				// Init badge socket connection
				//initBadgeSocket();
			});
		});
	}
	
	private initBadgeSocket() {
		// Open WebSocket connection
		const parsed = parseUrl(origin);
		const protocol = parsed.protocol.includes('https') ? 'wss://' : 'ws://';
		this.badgeSocket = new WebSocket(protocol + parsed.host + '/socket/chat/'+this.groupId+'/'+this.userToken);
		
		// WebSocket connection is established
		this.badgeSocket.onopen = (event) => {
			console.log(event);
		};
		
		// New Websocket message comes in
		this.badgeSocket.onmessage = (event) => {
			// Parse message from server
			var msg = JSON.parse(event.data);
			
			if (msg.hasOwnProperty('editorUpdated') && this.activeTab != 'editor') {
				console.log('editorUpdated: add badge');
			}
			
			// ...
		};
		
		// WebSocket connection was closed from server
		this.badgeSocket.onclose = (event) => {
			console.log(event);
		};
	}
	
	/**
	 * @desc: Clear badge of the tab wich was just opend
	 */
	private clearBadge() {
		if (this.activeTab == 'editor') {
			this.editorBadge = '';
			console.log('clear editor tab badge');
		}
		
		// ...
	}
	
	/*
	 * @desc: Opens 'productive mode'
	 */
	/*public enterFullscreen() {
		var element = document.documentElement;
		
		if(element.requestFullscreen) {
			element.requestFullscreen();
		/*} else if(element.mozRequestFullScreen) {
			element.mozRequestFullScreen();
		} else if(element.msRequestFullscreen) {
			element.msRequestFullscreen();/
		} else if(element.webkitRequestFullscreen) {
			element.webkitRequestFullscreen();
		}
	}*/

}
