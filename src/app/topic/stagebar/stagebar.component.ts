import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { TopicService } from '../../_services/topic.service';

import { BasicTopic } from '../../_models/topic/basic';

@Component({
	selector: 'stagebar',
	templateUrl: './stagebar.component.html',
	styleUrls: ['./stagebar.component.scss']
})
export class TopicStagebarComponent implements OnInit {
  
	public topicId: string;
	public basicTopic: BasicTopic;
	
	constructor(
	private router: Router,
	private topicService: TopicService
	) {
		// Get topicId from route
		this.topicId = this.router.url.split('/')[2];
		
		// Get basic topic
		this.basicTopic = this.topicService.getBasicTopicFromList(this.topicId);
	}
	
	ngOnInit() {}

}
