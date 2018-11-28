import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';
import { forkJoin } from 'rxjs/observable/forkJoin';
import { MatSnackBar } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';

import { AlertService } from '../_services/alert.service';
import { HttpManagerService } from '../_services/http-manager.service';
import { UserService } from '../_services/user.service';
import { ModalService } from '../_services/modal.service';
import { CloseeditorModalService } from '../_services/modal.closeeditor.service';

import * as sharedb from 'sharedb/lib/client';
import * as richText from 'rich-text';

import * as io from 'socket.io-client';
import * as $ from 'jquery';
import * as _ from 'underscore';

import origin from 'get-location-origin';
import parseUrl from 'url-parse';

import { faTimes } from '@fortawesome/free-solid-svg-icons';

@Component({
	selector: 'app-editor',
	templateUrl: './editor.component.html',
	styleUrls: ['./editor.component.scss']
})
export class EditorComponent implements OnInit, OnDestroy {
	public docId: string;
	public title: string;
	public saved: boolean = true;
	public placeholder: string;
	public connectionAlreadyLost: boolean = false;
	public manualClose: boolean = false;
	public padId: string;
	public userId: string;
	public topicId: string;
	public quillModules;
	public quillEditor;
	public userToken: string;
	public type: string;
	public deadlineInterval;
	public pingInterval;
	public padSocket;
	public modalSubscription: Subscription;
	
	private doc;
	
	public faTimes = faTimes;

	constructor(
		protected snackBar: MatSnackBar,
		protected alertService: AlertService,
		protected router: Router,
		protected activatedRoute: ActivatedRoute,
		protected modalService: ModalService,
		protected closeeditorModalService: CloseeditorModalService,
		protected httpManagerService: HttpManagerService,
		protected userService: UserService,
		protected translateService: TranslateService) {
			
		this.userId = this.userService.getUserId();
		this.userToken = this.userService.getToken();
		this.type = this.router.url.split('/')[1];
		
		// Set quill editor options
		this.quillModules = {
			toolbar: [
				['bold', 'italic', 'underline', 'strike'],
				[{ 'header': 1 }, { 'header': 2 }],
				[{ 'list': 'ordered'}, { 'list': 'bullet' }],
				[{ 'script': 'sub'}, { 'script': 'super' }],
				[{ 'indent': '-1'}, { 'indent': '+1' }],
				['link'],
				['clean']
			]
		}
		
		// Modal
		this.modalSubscription = this.closeeditorModalService.getResponse().subscribe(close => {
			// Close modal
			this.modalService.close();
			
			// Navigate to source
			if (close)
				this.router.navigate(['/topic', this.topicId]);
		});
	}
	
	ngOnInit() {
		// Set and translate placeholder
		let key = (this.type == 'topic') ? "EDITOR_PLACEHOLDER_TOPIC_DESCRIPTION" : "";
		key = (this.type == 'proposal') ? "EDITOR_PLACEHOLDER_PROPOSAL" : key;
		this.translatePlaceholder(key);
		
		// Initialize ping
		this.initServerPing();
	}
	
	ngOnDestroy() {
		this.manualClose = true;
		
		// Close pad socket
		if (this.padSocket)
			this.padSocket.close();
			
		// Unsubscribe to avoid memory leak
		this.modalSubscription.unsubscribe();
		
		// Stop countdown
		if (this.deadlineInterval)
			clearInterval(this.deadlineInterval);
		if (this.pingInterval)
			clearInterval(this.pingInterval);
	}
	
	protected translatePlaceholder(key) {
		this.translateService.get(key).subscribe(label => {
			this.placeholder = label;
		});
	}
	
	protected enableEdit() {
		$('.ql-editor').attr('contenteditable', 'true').fadeIn();
	}
	
	protected disableEdit() {
		$('.ql-editor').attr('contenteditable', 'false').hide();
	}
	
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
				this.title = res.title;
				this.docId = res.docId;
				this.topicId = res.topicId;
				
				// Check if document is expired
				if (Date.now() <= res.deadline) {
					// If not, initialize countdown
					this.initCountdown(res.deadline);
				} else {
					// If it is expired, switch to view
					this.redirectToView();
				}
				
				// Initialize socket
				this.initalizePadSocket(this.docId);
			});
		});
	}
	
	protected initalizePadSocket(docId) {
		sharedb.types.register(richText.type);

		// Open WebSocket connection to ShareDB server
		this.padSocket = new WebSocket('wss://' + parseUrl(origin).host + 'socket/pad/'+this.userToken);
		
		// WebSocket connection was established
		this.padSocket.onopen = function () {
			// Get ShareDB connection
			var connection = new sharedb.Connection(this.padSocket);
			
			// Create local Doc instance
			var doc = connection.get(this.getCollectionFromURL(), docId);
			this.doc = doc;
			
			// Subscribe to specific doc
			doc.subscribe(function(err) {
				if (err) throw err;
				
				// Get quill
				var quill = this.quillEditor;
				
				// Set quill contents from doc
				quill.setContents(doc.data);
				
				// On text change, send changes to ShareDB
				quill.on('text-change', function(delta, oldDelta, source) {
					if (source !== 'user') return;
					doc.submitOp(delta, {source: quill});
				});
				
				// Define a debounced version of setSaved function
				var lazySetSaved = _.debounce(this.setSaved.bind(this), 1000);
				
				// Is called when a operation was applied
				doc.on('op', function(op, source) {
					// If source is me, set saved and return
					if (source === quill) {
						lazySetSaved();
						return;
					}
					// If source is server, apply operation
					quill.updateContents(op);
				});
			}.bind(this));
			
			// WebSocket connection was closed from server
			this.padSocket.onclose = function(e) {
				// If pad socket was not closed actively (on destroy), inform user that
				// socket is broken, ask for reload and freeze editor
				if(!this.manualClose)
					this.connectionLostMessage();
			}.bind(this);
			
			this.enableEdit();
		}.bind(this);
	}
	
	/*
	 * @desc: Send ping to server in specific interval
	 */
	protected initServerPing() {
		// Send ping every 15 seconds
		this.pingInterval = setInterval(function() {
			this.httpManagerService.get('/json/ping').subscribe(res => {}, err => {
				// Connection is lost, show message
				this.connectionLostMessage();
			});
		}.bind(this), 15000);
	}
	
	/*
	 * @desc: Show message that connection is lost and redirect after some time
	 */
	protected connectionLostMessage() {
		if (this.connectionAlreadyLost)
			return;
		
		forkJoin(
			this.translateService.get('EDITOR_CONNECTION_LOST'),
			this.translateService.get('FORM_BUTTON_CLOSE'))
		.subscribe(([msg, action]) => {
			// Show message for 10 seconds
			let snackBarRef = this.snackBar.open(msg, action, {
				'duration': 10000
			});
			// After 10 seconds, redirect to topic
			snackBarRef.afterDismissed().subscribe(() => {
				this.router.navigate(['/topic', this.topicId]);
			});
		});
		
		// Mark connection already lost to avoid that this function is called twice
		this.connectionAlreadyLost = true
	}
	
	private getCollectionFromURL() {
		var key = this.router.url.split("/")[1];
		if (key == "topic")
			key = 'topic_description'
		return 'docs_'+key;
	}
	
	public closeEditor() {
		if (!this.saved) {
			this.modalService.open({});
			return;
		}
		
		// Navigate to topic
		this.router.navigate(['/topic', this.topicId]);
	}
	
	protected setSaved() {
		this.saved = true;
	}
	
	public contentChanged(e) {
		// If input source is not user, do not send a change to server
		if(e.source != 'user')
			return;
			
		// Set unsaved text
		this.saved = false;
	}
	
	private redirectToView() {
		if(this.type == 'topic')
			this.router.navigate(['/topic', this.topicId]);
		else if (this.type == 'proposal' || this.type == 'group')
			this.router.navigate(['/'+this.type+'/view', this.padId]);
	}
	
	/*
	 * @desc: Initialize timer and redirect from editor to view if deadline is over
	 */
	protected initCountdown(deadline) {
		var seconds = 0;
		
		// Run callback every second
		this.deadlineInterval = setInterval(function() {
			seconds++;
			let delta = deadline - Date.now();
			
			// If less than 2 minutes (120000ms) left, show time remaining in snackbar every 10 seconds
			if (delta > 0 && delta <= 120000 && seconds % 10 == 0) {
				var secondsLeft = String(Math.round(delta/1000));
				forkJoin(
					this.translateService.get('EDITOR_SNACKBAR_CLOSE_SECONDS', {s: secondsLeft}),
					this.translateService.get('FORM_BUTTON_CLOSE'))
				.subscribe(([msg, action]) => {
					this.snackBar.open(msg, action, {
						'duration': 3000
					});
				});
			}
			
			// If less than 2 hours (7200000ms) left, show time remaining in snackbar every 10 minutes
			if (delta > 0 && delta <= 7200000 && delta > 120000 && seconds % 600 == 0) {
				var minutesLeft = String(Math.round(delta/(1000*60)));
				forkJoin(
					this.translateService.get('EDITOR_SNACKBAR_CLOSE_MINUTES', {m: minutesLeft}),
					this.translateService.get('FORM_BUTTON_CLOSE'))
				.subscribe(([msg, action]) => {
					this.snackBar.open(msg, action, {
						'duration': 10000
					});
				});
			}
			
			// If countdown has finished, stop interval and redirect to view
			if (delta <= 0) {
				clearInterval(this.deadlineInterval);
				this.redirectToView();
			}
		}.bind(this), 1000);
	}

}
