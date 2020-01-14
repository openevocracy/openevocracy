import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { UserService } from '../../_services/user.service';
import { UtilsService } from '../../_services/utils.service';
import { HttpManagerService } from '../../_services/http-manager.service';
import { ConnectionAliveService } from '../../_services/connection.service';
import { TranslateService } from '@ngx-translate/core';

import * as parseUrl from 'url-parse';
import * as origin from 'get-location-origin';
import * as $ from 'jquery';
import * as _ from 'underscore';
import { C } from '../../../../shared/constants';

import { faPlay } from '@fortawesome/free-solid-svg-icons';

@Component({
	selector: 'app-chat',
	templateUrl: './chat.component.html',
	styleUrls: ['../group.component.scss', './chat.component.scss']
})
export class GroupChatComponent implements OnInit {
	
	public C = C;
	
	public userId: string;
	public userToken: string;
	
	public groupId: string;
	public chatSocket;
	public chatForm: FormGroup;
	public messages;
	public members;
	public memberColors = {};
	public memberNames = {};
	//public membersOnline;
	public mentionList = [];
	public mentionListAll = [];
	
	public faPlay = faPlay;
	
	constructor(
		private httpManagerService: HttpManagerService,
		private translateService: TranslateService,
		private userService: UserService,
		private utilsService: UtilsService,
		private router: Router,
		private formBuilder: FormBuilder,
		private connectionAliveService: ConnectionAliveService
	) {
		// Get user token and userId from user service
		this.userToken = this.userService.getToken();
		this.userId = this.userService.getUserId();
		
		// Initialize form
		this.chatForm = this.formBuilder.group({
			'msg': ['', Validators.required]
		});
		
		// Get current groupId
		this.groupId = this.router.url.split('/')[2];
		
		// Listen to connection lost event
		this.connectionAliveService.connectionLost.subscribe((res) => {
			// If connection is lost, close pad socket connection
			console.log('chat event: connection lost');
			if (this.chatSocket)
				this.chatSocket.close();
		});
		
		// Listen to connection reconnected event
		this.connectionAliveService.connectionReconnected.subscribe((res) => {
			console.log('chat event: reconnected');
			// If connection is lost, reconnect pad socket
			this.initializeChatSocket();
		});
	}
	
	ngOnInit() {
		// Initialize chat
		this.initializeChatSocket();
	}
	
	/*
	 * @desc: Initializes socket connection.
	 *        First do get request in order to get chat room information (including past messages),
	 *        then obtain who is online and initialize socker listener (onOpen, onMessage).
	 */
	private initializeChatSocket() {
		// Get all existing messages in chat room
		this.httpManagerService.get('/json/chat/room/' + this.groupId).subscribe(res => {
			
			// Add member color and member name map
			this.members = res.users;
			_.each(this.members, (member) => {
				this.memberColors[member.userId] = member.color;
				this.memberNames[member.userId] = member.name;
				//this.membersOnline[member.userId] = member.isOnline;
			});
			
			// Add names to mention list
			this.mentionListAll = _.pluck(this.members, 'name');
			this.mentionListAll.push('all');
			this.mentionList = _.without(this.mentionListAll, this.memberNames[this.userId]);
			
			// Add tags to mentions in messages, needs to be called after mentionList is created
			this.messages = res.messages;
			_.each(this.messages, (msg) => {
				msg.text = this.addTagToMention(msg.text);
			});
			
			// Open WebSocket connection
			const parsed = parseUrl(origin);
			const protocol = parsed.protocol.includes('https') ? 'wss://' : 'ws://';
			this.chatSocket = new WebSocket(protocol + parsed.host + '/socket/chat/'+res.chatRoomId+'/'+this.userToken);
			
			// WebSocket connection was established
			this.chatSocket.onopen = (event) => {
				// Send online status message
				this.chatSocket.send(JSON.stringify({
					'type': C.CHATMSG_ONLINE,
					'text': 'CHAT_ROOM_ENTER'
				}));
				
				// Start mutation observer to check if alert was added
				this.startMutationObserver();
			};
			
			// New Websocket message comes in
			this.chatSocket.onmessage = (event) => {
				// Parse message from server
				var msg = JSON.parse(event.data);
				
				// If it's a normal message, add tag to mention
				if (msg.type == C.CHATMSG_DEFAULT) {
					msg.text = this.addTagToMention(msg.text)
					this.messages.push(msg);
					return;
				}
				
				// If message contains online or offline type, translate text
				if (msg.type == C.CHATMSG_ONLINE || msg.type == C.CHATMSG_OFFLINE) {
					this.translateService.get(msg.text).subscribe(label => {
						msg.text = this.memberNames[msg.userId] + " " + label;
						this.messages.push(msg);
					});
				}
			};
			
			// WebSocket connection was closed from server
			this.chatSocket.onclose = (event) => {
				//console.log(event);
			};
			
			// Scroll down
			this.scrollDown();
			// On resize, scroll down, too
			$(window).on('resize', _.debounce(this.scrollDown, 250));
		});
	}
	
	/*
	 * @desc: Scrolls chat messages list down to the end.
	 *        Is called e.g. after loading or when new message comes in.
	 */
	private scrollDown() {
		const chat = document.getElementById('chat-messages');
		if (chat)
   		chat.scrollTop = chat.scrollHeight - chat.clientHeight;
	}
	
	/*
	 * @desc: Function is called when user filled out the form and
	 *        clicked the send button or pressed enter.
	 *        Message will be send via socket and form will be cleared after sending.
	 */
	public sendChatMessage() {
		if(!this.chatForm.valid)
			return;
		
		// Get message from form
		const msg = this.chatForm.value.msg;
		
		// Clear form
		this.chatForm.setValue({'msg': ''});
		
		// Send message
		this.chatSocket.send(JSON.stringify({
			'type': C.CHATMSG_DEFAULT,
			'text': msg
		}));
		
		// Define user ids by name
		const userIdsByName = {};
		_.each(this.members, (member) => { userIdsByName[member.name] = member.userId; });
		
		// Collect user ids which are mentioned in message
		const mentionedUserIds = _.chain(this.mentionList)
			.filter((name) => { return msg.includes('@'+name); })  // filters all names which are mentioned
			.map((name) => {  // gets ids of all user names which are mentioned
				if (name == 'all') {
					return _.without(_.pluck(this.members, 'userId'), this.userId);
				} else
					return userIdsByName[name]
			}).flatten().uniq().value();
		
		// If at least one user was mentioned, send mail to mentioned users
		const data = { 'groupId': this.groupId, 'userIds': mentionedUserIds };
		if (mentionedUserIds.length > 0) {
			this.httpManagerService.post('/json/chat/mentioned/', data).subscribe();
		}
	}
	
	/*
	 * @desc: Observes if a chat message is added to the list,
	 *        if so, scroll down to new message.
	 */
	private startMutationObserver() {
		// Define node which should be observed
		var node = document.querySelector('#chat-messages');
		
		// Define mutation observer and check if chat message was added
		var observer = new MutationObserver((mutations) => {
			// Scroll chat messages down
			this.scrollDown();
		});
		
		// Start observing if a child tag is added
		observer.observe(node, {
			childList: true
		});
	}
	
	/**
	 * @desc: Add tag around mentioned name of member
	 */
	private addTagToMention(msg) {
		// Add an html tag to the mentioned names in the message
		_.each(this.mentionListAll, (name) => {
			const htmlName = '<strong>@'+name+'</strong>';
			msg = this.utilsService.replaceAll(msg, '@'+name, htmlName);
		});
		return msg;
	}

}
