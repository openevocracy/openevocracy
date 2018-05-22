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
	private pid: string;
	private did: string;
	protected uid: string;
	protected xpid: string;
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
			
		this.uid = this.userService.getUserId();
		
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
	
	ngOnInit() { }
	
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
	
	protected editorCreated(editor, pid) {
		// Disable editor body
		this.disableEdit();
		
		// Bring toolbar to mat-toolbar
		$(".ql-toolbar").prependTo("#toolbar");
		
		// Set quill editor
		this.quillEditor = editor;
		
		// Get additional information and initalize socket
		this.activatedRoute.params.subscribe((params: Params) => {
				this.xpid = params.id;
				
				this.httpManagerService.get('/json' + this.router.url).subscribe(res => {
					this.pid = res.pid;
					this.did = res.did;
					this.title = res.title;
					this.source = res.source;
					
					// Initialize socket
					this.initalizeSocket(this.did);
				});
			});
	}
	
	protected initalizeSocket(did) {
		sharedb.types.register(richText.type);

		// Open WebSocket connection to ShareDB server
		this.socket = new WebSocket('wss://develop.openevocracy.org/socket?uid='+this.uid);
		
		this.socket.onopen = function () {
			console.log('Open');
		};
		
		var connection = new sharedb.Connection(this.socket);
		
		// Create local Doc instance mapped to 'examples' collection document with id 'richtext'
		var doc = connection.get('docs', did);
		this.doc = doc;
		doc.subscribe(function(err) {
			console.log('doc subscribe', doc);
			if (err) throw err;
			
			var quill = this.quillEditor;
			
			quill.setContents(doc.data);
			quill.on('text-change', function(delta, oldDelta, source) {
				if (source !== 'user') return;
				doc.submitOp(delta, {source: quill});
			});
			doc.on('op', function(op, source) {
				if (source === quill) return;
				quill.updateContents(op);
			});
		}.bind(this));
		
		this.enableEdit();
	}
	
	protected closeEditor() {
		if (!this.saved) {
			this.modalService.open({});
			return;
		}
		console.log('close', this.source);
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
