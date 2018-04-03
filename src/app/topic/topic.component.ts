import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';

import { CountdownComponent } from '../countdown/countdown.component'

import { TopicService } from '../_services/topic.service';

import { C } from '../../../shared/constants';
import { Topic } from '../_models/topic';

@Component({
	selector: 'app-topic',
	templateUrl: './topic.component.html',
	styleUrls: ['./topic.component.scss']
})
export class TopicComponent implements OnInit {
	private C;
	private tid: string;
	private topic: Topic;

	constructor(
		private topicService: TopicService,
		private activatedRoute: ActivatedRoute) { }
	
	ngOnInit() {
		this.C = C;
		
		this.activatedRoute.params.subscribe(
			(params: Params) => this.tid = params['id']);
		
		this.topicService.getTopic(this.tid).subscribe(res => {
			this.topic = new Topic(res);
		});
	}
	
	enterFullscreen() {
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
