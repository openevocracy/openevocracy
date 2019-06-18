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
import { ActivityListService} from '../_services/activitylist.service';

import { faHandPaper, faPlusSquare, faDownload } from '@fortawesome/free-solid-svg-icons';

@Component({
	selector: 'app-topics',
	templateUrl: './topiclist.component.html',
	styleUrls: ['./topiclist.component.scss'],
   providers: [ActivityListService]
})
export class TopiclistComponent implements OnInit {
	public C;
	public topicsList: TopicListElement[];
	private stageClass: string;
	
	public faHandPaper = faHandPaper;
	public faPlusSquare = faPlusSquare;
	public faDownload = faDownload;

	constructor(
		private topicsListService: TopicsListService,
		private topicService: TopicService,
		private userService: UserService,
		private activityListService: ActivityListService,
		private modal: ModalService,
		private router: Router) {}
	
	ngOnInit() {
		this.C = C;
		this.topicsListService.getTopicsList().subscribe(res => {
			// Add progress of stages to each topic for sorting purpose
			let withProgress = _.each(res, obj => {
				// Rejected stage progress number is passed stage + 1
				obj.progress = (obj.stage == C.STAGE_REJECTED) ? C.STAGE_PASSED+1 : obj.stage;
			});
			// Sort topics by progress and by name
			let sortedTopicsList = _.sortBy(_.sortBy(withProgress, 'name'), 'progress');
			
			// Initialize topicsList and construct all elements
			this.topicsList = [];
			_.each(sortedTopicsList, function(topicListElement) {
				this.topicsList.push(new TopicListElement(topicListElement));
			}.bind(this));
		});
	}
	
	/*
	 * @desc: Toggle vote (relevance) of topic in selection stage
	 */
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
				topic.numVotes--;
				
				this.activityListService.addActivity(C.ACT_TOPIC_UNVOTE, tid).subscribe(); // add activity
			});
		} else {
			this.topicService.vote(tid, uid).subscribe(res => {
				topic.voted = res.voted;
				topic.numVotes++;
				
				this.activityListService.addActivity(C.ACT_TOPIC_VOTE, tid).subscribe(); // add activity
			});
		}
	}
	
	/*
	 * @desc: Open modal to add new topic
	 */
	public openAddTopicModal(e) {
		e.preventDefault();
		this.modal.open({});
	}
	
	/*
	 * @desc: Download final document as pdf (open in new tab)
	 */
	private downloadPdf(e, topicId) {
		e.stopPropagation();
		this.topicService.downloadResultPdf(topicId);
	}
	
	/*
	 * @desc: Update specific topic list element, when its countdown has finished
	 * @param:
	 *    - topicId: topic id of topic which should be updated
	 */
	private updateElement(topicId) {
		// Wait 5 seconds after countdown has finished to avoid that old topic will be returned
		setTimeout(function() {
			// Get topic list element of specific topic element
			this.topicsListService.getTopicsListElement(topicId).subscribe(res => {
				// Make object
				let newTopicElement = new TopicListElement(res);
				// Map through all topics and update the chosen one, keep all other
				this.topicsList = _.map(this.topicsList, function(el) {
					if (el._id == topicId)
						return newTopicElement;
					else
						return el;
				});
			});
		}.bind(this), 5000);
	}
}
