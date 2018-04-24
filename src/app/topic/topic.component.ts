import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';

import { CountdownComponent } from '../countdown/countdown.component';

import { HttpManagerService } from '../_services/http-manager.service';
import { AlertService } from '../_services/alert.service';
import { TopicService } from '../_services/topic.service';
import { UserService } from '../_services/user.service';

import { C } from '../../../shared/constants';
import { cfg } from '../../../shared/config';
import { Topic } from '../_models/topic';

import * as io from 'socket.io-client';
import * as $ from 'jquery';

import { faHandPaper } from '@fortawesome/free-solid-svg-icons';
import { faExpandArrowsAlt } from '@fortawesome/free-solid-svg-icons';
import { faEllipsisV } from '@fortawesome/free-solid-svg-icons';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { faShareSquare } from '@fortawesome/free-solid-svg-icons';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
//import { faFileMedical } from '@fortawesome/free-solid-svg-icons';
import { faFile } from '@fortawesome/free-solid-svg-icons';
import { faSitemap } from '@fortawesome/free-solid-svg-icons';
import { faSave } from '@fortawesome/free-solid-svg-icons';
import { faEdit } from '@fortawesome/free-solid-svg-icons';

@Component({
	selector: 'app-topic',
	templateUrl: './topic.component.html',
	styleUrls: ['./topic.component.scss']
})
export class TopicComponent implements OnInit, OnDestroy {
	private C;
	private meUid;
	private tid: string;
	private topic: Topic;
	private socket;
	private quillEditor;
	private descriptionEdit: boolean = false;
	
	private faHandPaper = faHandPaper;
	private faExpandArrowsAlt = faExpandArrowsAlt;
	private faEllipsisV = faEllipsisV;
	private faUser = faUser;
	private faShareSquare = faShareSquare;
	private faDownload = faDownload;
	private faFileMedical = faFile;
	private faSitemap = faSitemap;
	private faSave = faSave;
	private faEdit = faEdit;
	
	constructor(
		private alertService: AlertService,
		private topicService: TopicService,
		private userService: UserService,
		private activatedRoute: ActivatedRoute,
		private httpManagerService: HttpManagerService) { }
	
   ngOnInit() {
		this.C = C;
		this.meUid = this.userService.getUserId();
		
		this.activatedRoute.params.subscribe(
			(params: Params) => this.tid = params['id']);
		
		this.topicService.getTopic(this.tid).subscribe(res => {
			this.topic = new Topic(res);
		});
	}
	
	ngOnDestroy() {
		if(this.socket)
			this.socket.disconnect();
	}
	
	private toggleDescriptionEdit() {
		if (this.descriptionEdit) {
			this.socket.disconnect();
			this.descriptionEdit = false;
		} else {
			this.descriptionEdit = true;
		}
	}
	
	private editorCreated(editor, pid) {
		// Disable editor body
		this.disableEdit();
		
		// Set quill editor
		this.quillEditor = editor;
		
		// Initialize socket
		this.initalizeSocket(pid);
	}
	
	private enableEdit() {
		$('.ql-editor').attr('contenteditable', 'true').fadeIn(500)
	}
	
	private disableEdit() {
		$('.ql-editor').attr('contenteditable', 'false').hide();
	}
	
	private initalizeSocket(pid) {
		// Establish socket connection
		this.socket = io.connect(cfg.BASE_URL);
		
		this.socket.on('setContents', function(contents) {
			this.quillEditor.setContents(contents);
			
			// Enable editor body
			this.enableEdit();
		}.bind(this));
		
		this.socket.on('change', function(change) {
			console.log('change', change);
			this.quillEditor.updateContents(change);
		});
		
		// Send pad id to server and ask for content
		this.socket.emit('pad_identity', {'pid': pid});
	}
	
	private contentChanged(e) {
		// If input source is not user, do not send a change to server
		if(e.source != 'user')
			return;
		
		// Emit current change to server via socket
		this.socket.emit('change', e.delta);
	}
	
	private createProposal() {
		this.httpManagerService.post('/json/proposal/create', {'tid': this.tid, 'uid': this.meUid}).subscribe(res => {
			console.log('proposal created', res);
			// Show alert
			this.alertService.alertFromServer(res.alert);
		});
	}
	
	private enterFullscreen() {
		// TODO: It's just for testing purpose, should be used in group
		
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

}
