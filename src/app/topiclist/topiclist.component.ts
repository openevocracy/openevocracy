import { Component, OnInit, Inject } from '@angular/core';
import { Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { CountdownComponent } from '../countdown/countdown.component';

import { TopicListElement } from '../_models/topic/topiclist-element';
import { C } from '../../../shared/constants';
import * as _ from 'underscore';

import { TopicService } from '../_services/topic.service';
import { UserService } from '../_services/user.service';
import { TopicsListService } from '../_services/topiclist.service';
import { ModalService } from '../_services/modal.service';

import { faHandPaper } from '@fortawesome/free-solid-svg-icons';
import { faPlusSquare } from '@fortawesome/free-solid-svg-icons';

@Component({
	selector: 'app-topics',
	templateUrl: './topiclist.component.html',
	styleUrls: ['./topiclist.component.scss']
})
export class TopiclistComponent implements OnInit {
	public C;
	private topicsList: TopicListElement[];
	private stageClass: string;
	
	private faHandPaper = faHandPaper;
	private faPlusSquare = faPlusSquare;

	constructor(
		private topicsListService: TopicsListService,
		private topicService: TopicService,
		private userService: UserService,
		private modal: ModalService,
		private router: Router) {}
	
	ngOnInit() {
		this.C = C;
		this.topicsListService.getTopicsList().subscribe(res => {
			// Add progress of stages to each topic for sorting purpose
			let with_progress = _.each(res, obj => {
				// Rejected stage progress number is passed stage + 1
				obj.progress = (obj.stage == C.STAGE_REJECTED) ? C.STAGE_PASSED+1 : obj.stage;
			});
			// Sort topics by progress and by name
			let sortedTopicsList = _.sortBy(_.sortBy(with_progress, 'name'), 'progress');
			
			// Initialize topicsList and construct all elements
			this.topicsList = [];
			_.each(sortedTopicsList, function(topicListElement) {
				this.topicsList.push(new TopicListElement(topicListElement));
			}.bind(this));
		});
	}
	
	private toggleVote(e, tid) {
		e.stopPropagation();
		
		// Get user id from user service
		var uid = this.userService.getUserId();
		
		// Get topic from topic list
		var topic = _.findWhere(this.topicsList, {'_id': tid});
		
		// Vote or unvote, depending of voted state
		if(topic.voted) {
			this.topicService.unvote(tid, uid).subscribe(res => {
				topic.voted = res.voted;
				topic.num_votes--;
			});
		} else {
			this.topicService.vote(tid, uid).subscribe(res => {
				topic.voted = res.voted;
				topic.num_votes++;
			});
		}
	}
	
	private openAddTopicModal(e) {
		e.preventDefault();
		this.modal.open({});
	}
}
