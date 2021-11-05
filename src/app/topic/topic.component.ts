import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

import { StageUpdateService } from '../_services/stageupdate.service';
import { TopicService } from '../_services/topic.service';

@Component({
	selector: 'app-topic',
	templateUrl: './topic.component.html',
	styleUrls: ['./topic.component.scss']
})
export class TopicComponent implements OnInit, OnDestroy {
	
	public topicId : string;
	public routerSubscription : any;
	public deadlineInterval : any;
	
	constructor(
		private router: Router,
		private topicService: TopicService,
		private stageUpdateService: StageUpdateService
	) {
		// Get topicId from route
		this.topicId = this.router.url.split('/')[2];
		
		// Get basic topic
		const basicTopic = this.topicService.getBasicTopicFromList(this.topicId);
			
		// Initialize stage update countdown
		this.deadlineInterval = this.stageUpdateService.initCountdown(
			basicTopic.nextDeadline,
			['/topic', this.topicId]
		);
	}
	
   ngOnInit() {}
   
   ngOnDestroy() {
   	// Unsubscribe from subscription to avoid memory leak
		if (this.routerSubscription)
			this.routerSubscription.unsubscribe();
		
		// Stop countdown
		if (this.deadlineInterval)
			clearInterval(this.deadlineInterval);
	}

}
