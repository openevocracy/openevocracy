import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';

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
	private savedStatus: string;
	private source: string;
	private quillModule;
	private socket;
	private quillEditor;
	private placeholder: string;
	
	private faTimes = faTimes;

	constructor(
		private router: Router,
		private activatedRoute: ActivatedRoute) {
		
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
	}
	
	ngOnInit() {
		this.activatedRoute.params.subscribe((params: Params) => {
				this.pid = params.id;
				this.source = params.source || false;
			});
	}
	
	ngOnDestroy() {
		if(this.socket)
			this.socket.disconnect();
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
		this.setUnsaved();
		
		// Emit current change to server via socket
		this.socket.emit('change', e.delta);
	}
	
	private setSaved() {
		this.savedStatus = 'EDITOR_SAVED_CHANGES';
	}
	
	private setUnsaved() {
		this.savedStatus = 'EDITOR_UNSAVED_CHANGES';
	}

}
