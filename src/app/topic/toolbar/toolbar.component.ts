import { Component, OnInit } from '@angular/core';
import { Router, Event, NavigationEnd } from '@angular/router';

import { TopicService } from '../../_services/topic.service';

import { BasicTopic } from '../../_models/topic/basic';
import { TopicToolbar } from '../../_models/topic/toolbar';

import { C } from '../../../../shared/constants';

import { faTh, faFile, faSitemap } from '@fortawesome/free-solid-svg-icons';

@Component({
	selector: 'topic-toolbar',
	templateUrl: './toolbar.component.html',
	styleUrls: ['./toolbar.component.scss']
})
export class TopicToolbarComponent implements OnInit {

	public C;
	public topicId: string;
	public topic: TopicToolbar;
	public basicTopic: BasicTopic;
	
	public activeTab: string = 'overview';

	public faTh = faTh;
	public faFile = faFile;
	public faSitemap = faSitemap;

	constructor(
		private router: Router,
		private topicService: TopicService
	) {
		this.C = C;
		
		// Get topicId from route
		this.topicId = this.router.url.split('/')[2];
		
		// Get basic topic
		this.basicTopic = this.topicService.getBasicTopicFromList(this.topicId);
			
		// Listen to route changes
		this.router.events.subscribe((event: Event) => {			
			// If navigation has finished
			if (event instanceof NavigationEnd) {
				// Get current path and define active tab
				this.activeTab = this.router.url.split('/')[3];
         }
		});
	}

	ngOnInit() {
		// Get data for toolbar from server
		this.topicService.getTopicToolbar(this.topicId).subscribe(res => {
			this.topic = new TopicToolbar(res);
		});
	}

}
