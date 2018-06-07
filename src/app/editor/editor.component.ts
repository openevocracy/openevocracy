import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';

import { HttpManagerService } from '../_services/http-manager.service';
import { UserService } from '../_services/user.service';
import { ModalService } from '../_services/modal.service';
import { CloseeditorModalService } from '../_services/modal.closeeditor.service';

import { cfg } from '../../../shared/config';

import * as sharedb from 'sharedb/lib/client';
import * as richText from 'rich-text';

import * as io from 'socket.io-client';
import * as $ from 'jquery';
import * as _ from 'underscore';

import { faTimes } from '@fortawesome/free-solid-svg-icons';

@Component({
	selector: 'app-editor',
	templateUrl: './editor.component.html',
	styleUrls: ['./editor.component.scss']
})
export class EditorComponent implements OnInit, OnDestroy {
	private docId: string;
	protected padId: string;
	protected userId: string;
	private title: string;
	private saved: boolean = true;
	protected source: string;
	protected quillModules;
	private socket;
	protected quillEditor;
	private placeholder: string;
	private modalSubscription: Subscription;
	
	private doc;
	
	private faTimes = faTimes;

	constructor(
		protected router: Router,
		protected activatedRoute: ActivatedRoute,
		protected modalService: ModalService,
		protected closeeditorModalService: CloseeditorModalService,
		protected httpManagerService: HttpManagerService,
		protected userService: UserService) {
			
		this.userId = this.userService.getUserId();
		
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
		
		this.placeholder = "...";
		
		this.modalSubscription = this.closeeditorModalService.getResponse().subscribe(close => {
			// Close modal
			this.modalService.close();
			
			// Navigate to source
			if (close)
				this.router.navigate(['/topic', this.source]);
		});
	}
	
	ngOnInit() {}
	
	ngOnDestroy() {
		if(this.socket)
			this.socket.close();
			
		// Unsubscribe to avoid memory leak
		this.modalSubscription.unsubscribe();
	}
	
	protected enableEdit() {
		$('.ql-editor').attr('contenteditable', 'true').fadeIn();
	}
	
	protected disableEdit() {
		$('.ql-editor').attr('contenteditable', 'false').hide();
	}
	
	protected editorCreated(editor) {
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
				this.source = res.source;
				
				// Initialize socket
				this.initalizeSocket(this.docId);
			});
		});
	}
	
	protected initalizeSocket(docId) {
		sharedb.types.register(richText.type);

		// Open WebSocket connection to ShareDB server
		var userToken = this.userService.getToken();
		this.socket = new WebSocket('wss://develop.openevocracy.org/socket/pad/'+userToken);
		
		// WebSocket connection was established
		this.socket.onopen = function () {
			// Get ShareDB connection
			var connection = new sharedb.Connection(this.socket);
			
			// Create local Doc instance
			var doc = connection.get(this.getCollectionFromURL(), docId);
			this.doc = doc;
			
			// Subscribe to specific doc
			doc.subscribe(function(err) {
				if (err) throw err;
				
				console.log(doc);
				
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
			
			this.enableEdit();
		}.bind(this);
	}
	
	private getCollectionFromURL() {
		var key = this.router.url.split("/")[1];
		if (key == "topic")
			key = 'topic_description'
		return 'docs_'+key;
	}
	
	protected closeEditor() {
		if (!this.saved) {
			this.modalService.open({});
			return;
		}
		
		// Navigate to source
		this.router.navigate(['/topic', this.source]);
	}
	
	protected setSaved() {
		this.saved = true;
	}
	
	protected contentChanged(e) {
		// If input source is not user, do not send a change to server
		if(e.source != 'user')
			return;
			
		// Set unsaved text
		this.saved = false;
		
		// Emit current change to server via socket
		//this.doc.submitOp(e.delta, {source: this.quillEditor});
	}

}
