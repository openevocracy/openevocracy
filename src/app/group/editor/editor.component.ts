import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';

import { AlertService } from '../../_services/alert.service';
import { HttpManagerService } from '../../_services/http-manager.service';
import { UserService } from '../../_services/user.service';
import { ModalService } from '../../_services/modal.service';
import { CloseeditorModalService } from '../../_services/modal.closeeditor.service';

import { EditorComponent } from '../../editor/editor.component';

import { Group } from '../../_models/group';

import 'quill-authorship-evo';
import * as $ from 'jquery';
import * as _ from 'underscore';

import * as parseUrl from 'url-parse';
import * as origin from 'get-location-origin';

import { C } from '../../../../shared/constants';

import { faUser, faFile, faHandshake, faLightbulb, faExpandArrowsAlt, faPlay, faComments } from '@fortawesome/free-solid-svg-icons';

@Component({
	selector: 'app-group',
	templateUrl: './editor.component.html',
	styleUrls: ['../../editor/editor.component.scss', './editor.component.scss']
})
export class GroupEditorComponent extends EditorComponent implements OnInit, OnDestroy {
	public C;
	public proposalHtml: string = "";
	public group: Group;
	public chatSocket;
	public chatForm: FormGroup;
	
	public chatReady: boolean = false;
	public chatHide: boolean = false;
	public me;
	public messages;
	public memberColors = {};
	public memberNames = {};
	public online = {};
	
	// Classes and styles for member proposal column
	public classColEditor: string = 'col-xs-12';
	public classColProposal: string = 'hidden';
	public styleColProposal = {'background-color': '#fff'};
	
	// FontAwesome icons
	public faUser = faUser;
	public faExpandArrowsAlt = faExpandArrowsAlt;
	public faFile = faFile;
	public faHandshake = faHandshake;
	public faLightbulb = faLightbulb;
	public faPlay = faPlay;
	public faComments = faComments;

  constructor(
		protected snackBar: MatSnackBar,
		protected alertService: AlertService,
		protected router: Router,
		protected activatedRoute: ActivatedRoute,
		protected modalService: ModalService,
		protected closeeditorModalService: CloseeditorModalService,
		protected httpManagerService: HttpManagerService,
		protected userService: UserService,
		protected translateService: TranslateService,
		private fb: FormBuilder) {
		super(snackBar, alertService, router, activatedRoute, modalService, closeeditorModalService, httpManagerService, userService, translateService);
		
		// Initialize form
		this.chatForm = this.fb.group({
			'msg': ['', Validators.required]
		});
		
		// Initialize authorship module
		this.quillModules = _.extend(this.quillModules,{
			'authorship': { 'enabled': true, 'authorId': this.userId }
		});
	}
	
	/*
	 * @desc: Lifecylce hook, used to set constants initially
	 */
	ngOnInit() {
		this.C = C;
		
		// Set and translate placeholder
		this.translatePlaceholder("EDITOR_PLACEHOLDER_GROUP");
		
		// Initialize ping
		this.initServerPing();
	}
	
	/*
	 * @desc: Lifecylce hook, used to close socket connection properly if view is destroyed
	 */
	ngOnDestroy() {
		this.manualClose = true;
		// Close pad socket
		if (this.padSocket)
			this.padSocket.close();
		
		// Close chat socket
		if (this.chatSocket) {
			// Send offline status message
			this.chatSocket.send(JSON.stringify({
				'type': C.CHATMSG_OFFLINE,
				'text': 'CHAT_ROOM_LEAVE'
			}));
			
			// Close connection
			this.chatSocket.close();
		}
		
		// Unsubscribe to avoid memory leak
		this.modalSubscription.unsubscribe();
		
		// Stop countdown
		if (this.deadlineInterval)
			clearInterval(this.deadlineInterval);
		if (this.pingInterval)
			clearInterval(this.pingInterval);
	}
	
	/*
	 * @desc: Overwrites editorCreated in editor component.
	 *        Mainly gets further information about group from server and
	 *        adds chat functionallity in addition to editor.
	 *        The function is called from editor component.
	 *
	 * @params:
	 *    editor: quill editor object
	 */
	public editorCreated(editor) {
		// Disable editor body
		this.disableEdit();
		
		// Bring toolbar to mat-toolbar
		$(".ql-toolbar").prependTo("#toolbar");
		
		// Set quill editor
		this.quillEditor = editor;
		
		// Get additional information and initalize socket
		this.activatedRoute.params.subscribe((params: Params) => {
				this.padId = params.id;
				
				this.httpManagerService.get('/json' + this.router.url).subscribe(res => {
					this.group = new Group(res);
					console.log(this.group);
					this.topicId = res.topicId;
					
					// Add color of current member
					this.me = _.findWhere(res.members, { 'userId': this.userId });
					this.quillEditor.getModule('authorship').addAuthor(this.userId, this.me.color);
					
					// Add colors of other members
					_.map(res.members, function(member) {
						if(member.userId != this.me.userId)
							this.quillEditor.getModule('authorship').addAuthor(member.userId, member.color);
					}.bind(this));
					
					/*this.quillEditor.getModule('cursors').set({
						id: this.me.userId,
						name: this.me.name,
						color: this.me.color,
						range: 1
					});*/
					
					// Initialize countdown
					this.initCountdown(res.deadline);
					
					// Initialize socket
					this.initalizePadSocket(this.group.docId);
					
					// Initialize chat
					this.initalizeChatSocket(this.group.chatRoomId);
				});
			});
	}
	
	/*
	 * @desc: Initializes socket connection.
	 *        First do get request in order to get chat room information (including past messages),
	 *        then obtain who is online and initialize socker listener (onOpen, onMessage).
	 *
	 * @params:
	 *    chatRoomId: the id of the chat room to open
	 */
	private initalizeChatSocket(chatRoomId) {
		// Add member color and member name map
		_.each(this.group.members, function(member) {
			this.memberColors[member.userId] = member.color;
			this.memberNames[member.userId] = member.name;
		}.bind(this));
		
		// Get all existing messages in chat room
		this.httpManagerService.get('/json/chat/room/' + chatRoomId).subscribe(res => {
			// Store existing messages
			this.messages = res.messages;
			
			// Add member online map
			_.each(this.group.members, function(mb) {
				this.online[mb.userId] = _.contains(res.users, mb.userId);
			}.bind(this));
			
			// Open WebSocket connection
			const parsed = parseUrl(origin);
			const protocol = parsed.protocol.includes('https') ? 'wss://' : 'ws://';
			this.chatSocket = new WebSocket(protocol + parsed.host + '/socket/chat/'+chatRoomId+'/'+this.userToken);
			
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
					if (msg.type == C.CHATMSG_ONLINE)
						this.online[msg.userId] = true;
					else if (msg.type == C.CHATMSG_OFFLINE)
						this.online[msg.userId] = false;
				}
			}.bind(this);
			
			// WebSocket connection was closed from server
			this.chatSocket.onclose = function(e) {
				// If chat socket was not closed actively (on destroy), inform user that
				// socket is broken, ask for reload and freeze chat
				if(!this.manualClose)
					this.connectionLostMessage();
			}.bind(this);
			// Show chat
			this.chatReady = true;
			
			// Initalize chat message view
			setTimeout(function() {
				// Set position of chat area
				this.setChatPositionAndSize();  // Initially
				$(window).on('resize', _.debounce(this.setChatPositionAndSize.bind(this), 250));  // While resize
			}.bind(this), 500);
		});
	}
	
	/*
	 * @desc: Calculates fixed position of chat window.
	 */
	private setChatPositionAndSize() {
		if($('body').innerWidth() < 1200) {
			this.chatHide = true;
			return;
		}
		this.chatHide = false;
		
		// Position and size of wrapper box
		let top = $('.editor-toolbars').position().top + $('.editor-toolbars').height();
		let left = $('.editor-center').position().left + $('.editor-center').outerWidth();
		let width = $('body').innerWidth()-left;
		let height = $('footer').position().top-top;
		$('#chat-wrapper').css({
			'top': top+'px',
			'left': left+'px',
			'width': width+'px',
			'height': height+'px'
		});
		
		// Height of chat messages box
		let msgHeight = height - $('#chat-wrapper form').outerHeight() - 10;  // 10px is the bottom distance from form
		//let $chatMessages = $('#chat-messages');
		$('#chat-messages').css({
			'height': msgHeight+'px'
		});
		
		// Scroll to bottom of messages
		this.scrollDown();
		
		// TODO add responsive functionallity
	}
	
	/*
	 * @desc: Scrolls chat messages list down to the end.
	 *        Is called e.g. after loading or when new message comes in.
	 */
	private scrollDown() {
		let $chat = $('#chat-messages')[0];
		// Avoid error after re-showing chat view (undefined in some cases)
		if ($chat)
			$('#chat-messages').scrollTop($chat.scrollHeight);
	}
	
	/*
	 * @desc: Posts rating of user to server
	 *
	 * @params:
	 *    e:           event (given by rate component)
	 *    ratedUserId: user which was rated
	 *    type:        type of rating (e.g. default message, online message)
	 */
	private rate(e, ratedUserId, type) {
		// Do not post new rating to server, if the new rating is equal to the old rating
		var ratedMember = _.findWhere(this.group.members, {'userId': ratedUserId});
		if(type == C.RATING_INTEGRATION && ratedMember.ratingIntegration == e.rating)
			return;
		if(type == C.RATING_KNOWLEDGE && ratedMember.ratingKnowledge == e.rating)	
			return;
			
		// Post rating to server
		var rating = {	'groupId': this.group.groupId, 'ratedUserId': ratedUserId, 'score': e.rating, 'type': type };
		this.httpManagerService.post('/json/ratings/rate', rating).subscribe();
	}
	
	/*
	 * @desc: Opens 'productive mode'
	 */
	public enterFullscreen() {
		var element = document.documentElement;
		
		if(element.requestFullscreen) {
			element.requestFullscreen();
		/*} else if(element.mozRequestFullScreen) {
			element.mozRequestFullScreen();
		} else if(element.msRequestFullscreen) {
			element.msRequestFullscreen();*/
		} else if(element.webkitRequestFullscreen) {
			element.webkitRequestFullscreen();
		}
	}
	
	/*
	 * @desc: Opens a member proposal
	 */
	private openMemberProposal(html: string, color: string) {
		this.classColEditor = 'col-xs-6';
		this.classColProposal = 'col-xs-6';
		this.styleColProposal = {'background-color': color};
		this.proposalHtml = html;
	}
	
	/*
	 * @desc: When a member proposal was open and user closes or
	 *        chooses antoher member proposal, this function is called
	 *        in order to close the particular member proposal. 
	 */
	public closeMemberProposal() {
		this.classColEditor = 'col-xs-12';
		this.classColProposal = 'hidden';
		this.proposalHtml = "";
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
		var observer = new MutationObserver(function(mutations) {
			// Scroll chat messages down
			this.scrollDown();
		}.bind(this));
		
		// Start observing if a child tag is added
		observer.observe(node, {
			childList: true
		});
	}

}
