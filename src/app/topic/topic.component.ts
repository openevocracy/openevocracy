import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';

import { CountdownComponent } from '../countdown/countdown.component';

import { HttpManagerService } from '../_services/http-manager.service';
import { AlertService } from '../_services/alert.service';
import { TopicService } from '../_services/topic.service';
import { UserService } from '../_services/user.service';

import { C } from '../../../shared/constants';
import { cfg } from '../../../shared/config';
import { Topic } from '../_models/topic';

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
export class TopicComponent implements OnInit {
	private C;
	private uid;
	private tid: string;
	private topic: Topic;
	
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
		private router: Router,
		private alertService: AlertService,
		private topicService: TopicService,
		private userService: UserService,
		private activatedRoute: ActivatedRoute,
		private httpManagerService: HttpManagerService) {}
	
   ngOnInit() {
		this.C = C;
		this.uid = this.userService.getUserId();
		
		this.activatedRoute.params.subscribe(
			(params: Params) => this.tid = params['id']);
		
		this.topicService.getTopic(this.tid).subscribe(res => {
			this.topic = new Topic(res);
		});
	}
	
	private openEditor(pid) {
		// Redirect to editor view
		this.router.navigate(['/editor/', pid, { 'source': '/topic/'+this.tid }]);
	}
	
	private createProposal() {
		this.httpManagerService.post('/json/proposal/create', {'tid': this.tid, 'uid': this.uid}).subscribe(res => {
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
