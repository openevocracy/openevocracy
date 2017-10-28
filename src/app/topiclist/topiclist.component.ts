import { Component, OnInit, Inject } from '@angular/core';
import { Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { TopicListElement } from '../_models/topic-list-element';
import { C } from '../_shared/constants';

import { TopicsListService } from '../_services/topics-list.service';

import { ModalService } from '../_services/modal.service';
import { AddtopicService } from '../_services/addtopic.service';

@Component({
	selector: 'app-topics',
	templateUrl: './topiclist.component.html',
	styleUrls: ['./topiclist.component.scss']
})
export class TopiclistComponent implements OnInit {
	public C;
	topicsList: TopicListElement[];
	stageClass: string;

	constructor(
		private topicsListService: TopicsListService,
		private modal: ModalService,
		private router: Router,
		private addtopicService: AddtopicService) { 
	}
	
	ngOnInit() {
		this.C = C;
		this.topicsListService.getTopicsList().subscribe(
			res => this.topicsList = res);
	}
	
	private openTopic(tid) {
		// Open specific topic with _id tid
		this.router.navigate(['/topic/'+tid]);
	}
	
	private addTopic(e) {
		e.preventDefault();
		this.modal.open({});
	}
	
	/*private refreshList(e) {
		e.preventDefault();
		// TODO
	}*/
}
