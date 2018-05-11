import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';

import { HttpManagerService } from '../_services/http-manager.service';
import { ModalService } from '../_services/modal.service';
import { CloseeditorModalService } from '../_services/modal.closeeditor.service';

import { cfg } from '../../../shared/config';

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
	private title: string;
	private saved: boolean = true;
	private source: string;
	private quillModule;
	private socket;
	private quillEditor;
	private placeholder: string;
	private modalSubscription: Subscription;
	
	private faTimes = faTimes;

	constructor(
		private router: Router,
		private activatedRoute: ActivatedRoute,
		private modalService: ModalService,
		private closeeditorModalService: CloseeditorModalService,
		private httpManagerService: HttpManagerService) {
		
		this.quillModule = {
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
	
	ngOnInit() {
		this.activatedRoute.params.subscribe((params: Params) => {
				this.pid = params.id;
				
				this.httpManagerService.get('/json/editor/' + this.pid).subscribe(res => {
					this.title = res.title;
					this.source = res.source;
				});
			});
	}
	
	ngOnDestroy() {
		console.log('destroyed');
		if(this.socket)
			this.socket.disconnect();
			
		// Unsubscribe to avoid memory leak
		this.modalSubscription.unsubscribe();
	}
	
	private enableEdit() {
		$('.ql-editor').attr('contenteditable', 'true').fadeIn();
	}
	
	private disableEdit() {
		$('.ql-editor').attr('contenteditable', 'false').hide();
	}
	
	private editorCreated(editor, pid) {
		// Disable editor body
		this.disableEdit();
		
		// Bring toolbar to mat-toolbar
		$(".ql-toolbar").prependTo("#toolbar");
		
		// Set quill editor
		this.quillEditor = editor;
		
		// Initialize socket
		this.initalizeSocket(pid);
	}
	
	private initalizeSocket(pid) {
		// Establish socket connection
		this.socket = io.connect(cfg.BASE_URL);
		
		// If 'setContents' event comes in, set contents to editor
		this.socket.on('setContents', function(contents) {
			this.quillEditor.setContents(contents);
			
			// Enable editor body
			this.enableEdit();
		}.bind(this));
		
		// If 'change' event comes in, update editor
		this.socket.on('change', function(change) {
			console.log('change', change);
			this.quillEditor.updateContents(change);
		});
		
		// Define a debounced version of setSaved function
		var lazySetSaved = _.debounce(this.setSaved.bind(this), 1000);
		this.socket.on('submitted', function(submitted) {
			// Set saved text
			lazySetSaved();
		});
		
		// Send pad id to server and ask for content
		this.socket.emit('pad_identity', {'pid': pid});
	}
	
	private contentChanged(e) {
		// If input source is not user, do not send a change to server
		if(e.source != 'user')
			return;
			
		// Set unsaved text
		this.saved = false;
		
		// Emit current change to server via socket
		this.socket.emit('change', e.delta);
	}
	
	private setSaved() {
		this.saved = true;
	}
	
	private closeEditor() {
		if (!this.saved) {
		//if (true) {
			this.modalService.open({});
			return;
		}
			
		
		// Navigate to source
		this.router.navigate(['/topic', this.source]);
	}

}
