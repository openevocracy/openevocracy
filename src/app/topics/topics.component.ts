import { Component, OnInit, Inject } from '@angular/core';

import { TopicListElement } from '../shared/topic-list-element';
import { C } from '../shared/constants';

import { TopicsListService } from '../services/topics-list.service';

@Component({
	selector: 'app-topics',
	templateUrl: './topics.component.html',
	styleUrls: ['./topics.component.scss']
})
export class TopicsComponent implements OnInit {
	public C;
	topicsList: TopicListElement[];
	stageClass: string;
	
	constructor(private topicsListService: TopicsListService) { }
	
	ngOnInit() {
		this.C = C;
		this.topicsListService.getTopicsList().subscribe(
			res => this.topicsList = res);
	}
}
