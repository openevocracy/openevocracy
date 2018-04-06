import { Component, OnInit, Inject } from '@angular/core';
import { Validators } from '@angular/forms';
import { Router } from '@angular/router';
import * as _ from 'underscore';

import { TopicListElement } from '../_models/topic-list-element';
import { C } from '../../../shared/constants';

import { TopicService } from '../_services/topic.service';
import { TopicsListService } from '../_services/topics-list.service';
import { ModalService } from '../_services/modal.service';

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
		private topicService: TopicService,
		private modal: ModalService,
		private router: Router) { }
	
	ngOnInit() {
		this.C = C;
		this.topicsListService.getTopicsList().subscribe(res => {
			let with_progress = _.each(res, obj => {
				obj.progress = (obj.stage == -1) ? 9 : obj.stage;
			});
			this.topicsList = _.sortBy(_.sortBy(with_progress, 'name'), 'progress');
		});
	}
	
	private vote(e, tid) {
		e.stopPropagation();
		console.log('vote', tid);
		/*this.topicService.vote(tid).subscribe(res => {
			let body = res.json();
			// Update topic in topiclist
			console.log(body);
		});*/
	}
	
	private openAddTopicModal(e) {
		e.preventDefault();
		this.modal.open({});
	}
}
