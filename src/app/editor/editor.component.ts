import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';
import { forkJoin } from 'rxjs/observable/forkJoin';
import { MatSnackBar, MatDialog } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';

import { ConnectionAliveService } from '../_services/connection.service';
import { UserService } from '../_services/user.service';
import { EditorService } from '../_editor/editor.service';

import { CloseEditorDialogComponent } from '../dialogs/closeeditor/closeeditor.component';

import * as sharedb from 'sharedb/lib/client';
import * as richText from 'rich-text';

import * as io from 'socket.io-client';
import * as $ from 'jquery';
import * as _ from 'underscore';

import * as parseUrl from 'url-parse';
import * as origin from 'get-location-origin';

import { faTimes } from '@fortawesome/free-solid-svg-icons';

@Component({
	selector: 'app-editor',
	templateUrl: './editor.component.html',
	styleUrls: ['./editor.component.scss']
})
export class EditorComponent implements OnInit, OnDestroy {
	public title: string;
	public saved: boolean = true;
	public placeholder: string;
	public userId: string;
	public topicId: string;
	public classColEditor;
	public quillModules;
	public editor;
	public userToken: string;
	public deadlineInterval;
	public padSocket;
	
	public connectionLostSubscription;
	public connectionReconnectedSubscription;
	
	private doc;
	
	public faTimes = faTimes;

	constructor(
		protected snackBar: MatSnackBar,
		protected router: Router,
		protected userService: UserService,
		protected translateService: TranslateService,
		protected connectionAliveService: ConnectionAliveService,
		protected editorService: EditorService,
		protected dialog: MatDialog
	) {
		this.userId = this.userService.getUserId();
		this.userToken = this.userService.getToken();
		
		// Set quill editor options
		this.quillModules = {
			toolbar: [
				['bold', 'italic'], //, 'underline', 'strike'],
				[{ 'header': 1 }, { 'header': 2 }],
				[{ 'list': 'ordered'}, { 'list': 'bullet' }],
				//[{ 'script': 'sub'}, { 'script': 'super' }],
				//[{ 'indent': '-1'}, { 'indent': '+1' }],
				//['link'],
				//['clean']
			]
		}
		
		// Listen to connection lost event
		this.connectionLostSubscription = this.connectionAliveService.connectionLost.subscribe((res) => {
			console.log('diconnect editor');
			// If connection is lost, close pad socket connection
			if (this.padSocket)
				this.padSocket.close();
		});
		
		// Listen to connection reconnected event
		this.connectionReconnectedSubscription = this.connectionAliveService.connectionReconnected.subscribe((res) => {
			console.log('reconnect editor');
			// If connection is lost, reconnect pad socket
			this.initializePadSocket();
		});
	}
	
	ngOnInit() { }
	
	ngOnDestroy() {
		// Close pad socket
		if (this.padSocket)
			this.padSocket.close();
		
		// Stop countdown
		if (this.deadlineInterval)
			clearInterval(this.deadlineInterval);
			
		// Unsubscribe from event emitter
		this.connectionLostSubscription.unsubscribe();
		this.connectionReconnectedSubscription.unsubscribe();
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
	
	/**
	 * @desc: Initializes basic stuff for quill editor
	 */
	public initializeEditor(editor) {
		
		// Disable editor body
		this.disableEdit();
		
		// Set and translate placeholder
		this.translatePlaceholder(editor.placeholder);
		
		// Bring toolbar to mat-toolbar
		$(".ql-toolbar").prependTo("#toolbar");
		
		// Set quill editor
		this.editor = editor;
		
		// Register saved status of editor in editor service
		this.editorService.setIsSaved(editor.padId, true);
		
		// Initialize socket
		this.initializePadSocket();
		
		// Initialize countdown
		this.initCountdown(this.editor.deadline);
	}
	
	/**
	 * @desc: Switch track changes mode on/off
	 */
	private toggleTrackChanges() {
		
	}
	
	/**
	 * @desc: Accept a specific text change
	 */
	private acceptChange(cssClass) {
		// If deleted, submit finally delete text
		
		
		// If inserted, submit remove "inserted" class
		
	}
	
	/**
	 * @desc: Create pad socket and sharedb connection
	 */
	private initializePadSocket() {
		// Register sharedb richt text type
		sharedb.types.register(richText.type);

		// Open WebSocket connection to ShareDB server
		const parsed = parseUrl(origin);
		const protocol = parsed.protocol.includes('https') ? 'wss://' : 'ws://';
		this.padSocket = new WebSocket(protocol + parsed.host + '/socket/pad/'+this.userToken);

		// WebSocket connection was established
		this.padSocket.onopen = (event) => {
			// Get ShareDB connection
			const connection = new sharedb.Connection(this.padSocket);
			
			// Create local Doc instance
			const doc = connection.get(this.editor.type, this.editor.docId);
			this.doc = doc;
			
			// Subscribe to specific doc
			doc.subscribe((err) => {
				if (err) throw err;
				// Set quill contents from doc
				this.editor.setContents(doc.data);
				
				// Call after content initialized
				this.afterContentInit();
				
				// On text change, send changes to ShareDB
				this.editor.on('text-change', (delta, oldDelta, source) => {
					if (source !== 'user') return;
					
					console.log('delta', delta);
					
					delta.ops.forEach((op) => {
						// Check if any operation contains an insert
						if (op.insert) {
							console.log('insert');
							// Add class to inserted letter
							
							
							// Submit op + new class
							
						}
						
						// Check if any operation contains a delete
						if (op.delete) {
							console.log('delete');
							// Add class to deleted letter
							
							
							// Only submit class change, not delete operation
							
						}
					});
					
					doc.submitOp(delta, { 'source': this.editor });
				});
				
				// Define a debounced version of setSaved function
				var lazySetSaved = _.debounce(this.setSaved.bind(this), 1000);
	
				// Is called when a operation was applied
				doc.on('op', (op, source) => {
					// If source is me, set saved and return
					if (source === this.editor) {
						lazySetSaved();
						return;
					}
					// If source is server, apply operation
					this.editor.updateContents(op);
				});
			});

			// WebSocket connection was closed from server
			this.padSocket.onclose = (event) => {
				//console.log(event);
			};
	
			// Enable edit again
			this.enableEdit();
		};
	}
	
	public afterContentInit() {}
	
	/**
	 * @desc: Closes the editor
	 */
	public closeEditor() {
		// If editor is fully saved, navigate to topic
		if (this.editorService.isSaved(this.editor.padId)) {
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
	
	/**
	 * @desc: Set editor status to saved
	 */
	protected setSaved() {
		this.saved = true;  // Important for template
		this.editorService.setIsSaved(this.editor.padId, true);
	}
	
	/**
	 * @desc: Is called when text has changed in editor
	 */
	public contentChanged(e) {
		// If input source is not user, do not send a change to server
		if(e.source != 'user')
			return;
			
		// Set unsaved text
		this.saved = false;  // Important for template
		this.editorService.setIsSaved(this.editor.padId, false);
		
		// Call after content changed
		this.afterContentChanged();
	}
	
	public afterContentChanged() {}
	
	/*
	 * @desc: Initialize timer and redirect from editor to view if deadline is over
	 */
	private initCountdown(deadline) {
		let delta = deadline - Date.now();
		
		// Safely exit here, when deadline is over
		if (delta <= 0)
			return;
		
		// Run callback every second
		this.deadlineInterval = setInterval(function() {
			delta = deadline - Date.now();
			const seconds = Math.floor(delta/1000);
			
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
			
			// If countdown has finished, stop interval and update view
			if (delta <= 0) {
				clearInterval(this.deadlineInterval);
				// Update view, this functions needs to be implemented in all child components
				this.updateView();
			}
		}.bind(this), 1000);
	}

}
