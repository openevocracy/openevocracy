import { Component, OnInit, Inject } from '@angular/core';
//import { MatGridListModule, MatCardModule } from '@angular/material';

import { TopicListElement } from '../_models/topic-list-element';
import { C } from '../_shared/constants';

import { TopicsListService } from '../_services/topics-list.service';

@Component({
	selector: 'app-topics',
	templateUrl: './topiclist.component.html',
	styleUrls: ['./topiclist.component.scss']
})
export class TopiclistComponent implements OnInit {
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
