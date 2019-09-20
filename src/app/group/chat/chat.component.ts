import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { UserService } from '../../_services/user.service';
import { HttpManagerService } from '../../_services/http-manager.service';
import { TranslateService } from '@ngx-translate/core';

import { TributeOptions } from 'tributejs';
import { NgxTributeModule } from 'ngx-tribute';

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
	
	public options: TributeOptions<any> = {
		values: [
			{ key: 'foo', value: 'Foo' },
			{ key: 'bar', value: 'Bar' },
			{ key: 'baz', value: 'Baz' }
		]
	};
	
	public C = C;
	
	public userId;
	public userToken;
	
	public groupId;
	public chatSocket;
	public chatForm: FormGroup;
	public messages;
	public members;
	public memberColors = {};
	public memberNames = {};
	//public membersOnline;
	
	public faPlay = faPlay;
	
	constructor(
		private httpManagerService: HttpManagerService,
		private translateService: TranslateService,
		private userService: UserService,
		private router: Router,
		private formBuilder: FormBuilder
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
	}
	
	ngOnInit() {
		/*this.quillEditor.getModule('cursors').set({
			id: this.me.userId,
			name: this.me.name,
			color: this.me.color,
			range: 1
		});*/
		
		// Initialize chat
		this.initalizeChatSocket();
	}
	
	/*
	 * @desc: Initializes socket connection.
	 *        First do get request in order to get chat room information (including past messages),
	 *        then obtain who is online and initialize socker listener (onOpen, onMessage).
	 */
	private initalizeChatSocket() {
		
		// Get all existing messages in chat room
		this.httpManagerService.get('/json/chat/room/' + this.groupId).subscribe(res => {
			
			// Store existing messages
			this.messages = res.messages;
			this.members = res.users;
			
			// Add member color and member name map
			_.each(this.members, (member) => {
				this.memberColors[member.userId] = member.color;
				this.memberNames[member.userId] = member.name;
				//this.membersOnline[member.userId] = member.isOnline;
			});
			
			// Open WebSocket connection
			const parsed = parseUrl(origin);
			const protocol = parsed.protocol.includes('https') ? 'wss://' : 'ws://';
			this.chatSocket = new WebSocket(protocol + parsed.host + '/socket/chat/'+res.chatRoomId+'/'+this.userToken);
			
			// WebSocket connection was established
			this.chatSocket.onopen = function () {
				// Send online status message
				this.chatSocket.send(JSON.stringify({
					'type': C.CHATMSG_ONLINE,
					'text': 'CHAT_ROOM_ENTER'
				}));
				
				// Start mutation observer to check if alert was added
				this.startMutationObserver();
			}.bind(this);
			
			// New Websocket message comes in
			this.chatSocket.onmessage = function (e) {
				// Parse message from server
				var msg = JSON.parse(e.data);
				
				// If it's a normal message, just add message to messages array
				if (msg.type == C.CHATMSG_DEFAULT) {
					this.messages.push(msg);
					return;
				}
				
				// If message contains online or offline type, translate text
				if (msg.type == C.CHATMSG_ONLINE || msg.type == C.CHATMSG_OFFLINE) {
					this.translateService.get(msg.text).subscribe(label => {
						msg.text = this.memberNames[msg.userId] + " " + label;
						this.messages.push(msg);
					});
					
					// Update status of specific user
					/*if (msg.type == C.CHATMSG_ONLINE)
						this.membersOnline[msg.userId] = true;
					else if (msg.type == C.CHATMSG_OFFLINE)
						this.membersOnline[msg.userId] = false;*/
				}
			}.bind(this);
			
			// WebSocket connection was closed from server
			this.chatSocket.onclose = function(e) {
				// If chat socket was not closed actively (on destroy), inform user that
				// socket is broken, ask for reload and freeze chat
				/*if(!this.manualClose)
					this.connectionLostMessage();*/
			}.bind(this);
			// Show chat
			//this.chatReady = true;
			
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
   	chat.scrollTop = chat.scrollHeight - chat.clientHeight;
	}
	
	/*
	 * @desc: Function is called when user filled out the form and
	 *        clicked the send button or pressed enter.
	 *        Message will be send via socket and form will be cleared after sending.
	 */
	private sendChatMessage() {
		if(!this.chatForm.valid)
			return;
		
		// Send message
		this.chatSocket.send(JSON.stringify({
			'type': C.CHATMSG_DEFAULT,
			'text': this.chatForm.value.msg
		}));
		
		// Clear form
		this.chatForm.setValue({'msg': ''});
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

}
