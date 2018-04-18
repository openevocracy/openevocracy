import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';

import { FormBuilder, FormGroup } from '@angular/forms';

import { CountdownComponent } from '../countdown/countdown.component';

import { TopicService } from '../_services/topic.service';

import { C } from '../../../shared/constants';
import { Topic } from '../_models/topic';

import * as io from 'socket.io-client';

import { faHandPaper } from '@fortawesome/free-solid-svg-icons';
import { faExpandArrowsAlt } from '@fortawesome/free-solid-svg-icons';
import { faEllipsisV } from '@fortawesome/free-solid-svg-icons';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { faShareSquare } from '@fortawesome/free-solid-svg-icons';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
//import { faFileMedical } from '@fortawesome/free-solid-svg-icons';
import { faFile } from '@fortawesome/free-solid-svg-icons';
import { faSitemap } from '@fortawesome/free-solid-svg-icons';

@Component({
	selector: 'app-topic',
	templateUrl: './topic.component.html',
	styleUrls: ['./topic.component.scss']
})
export class TopicComponent implements OnInit, OnDestroy {
	private C;
	private tid: string;
	private topic: Topic;
	private editorForm: FormGroup;
	private socket;
	
	faHandPaper = faHandPaper;
	faExpandArrowsAlt = faExpandArrowsAlt;
	faEllipsisV = faEllipsisV;
	faUser = faUser;
	faShareSquare = faShareSquare;
	faDownload = faDownload;
	faFileMedical = faFile;
	faSitemap = faSitemap;
	
	constructor(
		private topicService: TopicService,
		private activatedRoute: ActivatedRoute,
		private fb: FormBuilder) { }
	
   ngOnInit() {
		this.C = C;
		
		this.activatedRoute.params.subscribe(
			(params: Params) => this.tid = params['id']);
		
		this.topicService.getTopic(this.tid).subscribe(res => {
			this.topic = new Topic(res);
			
			this.initalizeSocket();
		});
		
		this.editorForm = this.fb.group({
      	editor: ['...']
   	});
	}
	
	ngOnDestroy() {
		this.socket.disconnect();
	}
	
	private initalizeSocket() {
		this.socket = io.connect('https://develop.openevocracy.org');
		
		this.socket.on('setContents', function(contents) {
			console.log('setContents', contents);
		});
		
		this.socket.on('change', function(change) {
			console.log('change', change);
		});
		
		this.socket.emit('pad_identity', {'pid': this.topic.pid});
	}
	
	private contentChanged(e) {
		console.log(e);
		
		if(e.source != 'user')
			return;
		
		this.socket.emit('change', e.delta);
	}
	
	private setText(text) {
		this.editorForm.patchValue({'editor': text});
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
