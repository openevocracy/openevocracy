import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { TopicOverview } from '../../_models/topic/overview';

import { GroupvisComponent } from '../../groupvis/groupvis.component';

import { TopicService } from '../../_services/topic.service';
import { UserService } from '../../_services/user.service';
import { ActivityListService} from '../../_services/activitylist.service';

import { C } from '../../../../shared/constants';

import { faUser, faUsers, faFile, faHandPaper } from '@fortawesome/free-solid-svg-icons';

@Component({
	selector: 'app-overview',
	templateUrl: './overview.component.html',
	styleUrls: ['./overview.component.scss']
})
export class TopicOverviewComponent implements OnInit {
	
	//@ViewChild(GroupvisComponent)
	//private groupvis: GroupvisComponent;
	
	public C;
	public topicId: string;
	public userId: string;
	public topic: TopicOverview;
	
	//public showGraph: boolean = false;
	
	public faUser = faUser;
	public faUsers = faUsers;
	public faFile = faFile;
	public faHandPaper = faHandPaper;

	constructor(
		private router: Router,
		private topicService: TopicService,
		private userService: UserService,
		private activityListService: ActivityListService
	) {
		this.C = C;
		
		// Get topicId from route
		this.topicId = this.router.url.split('/')[2];
		
		// Get userId from user service
		this.userId = this.userService.getUserId();
	}
	
	ngOnInit() {
		// Get topic overview data from server
		this.topicService.getTopicOverview(this.topicId).subscribe(res => {
			this.topic = new TopicOverview(res);
		});
	}
	
	/*
	 * @desc: Download final document as pdf (open in new tab)
	 */
	private downloadPdf() {
		//this.topicService.downloadResultPdf(this.topicId);
	}
	
	/**
	 * @desc: Vote or unvote topic (mark or unmark as relevant)
	 */
	private toggleVote() {
		// Vote or unvote, depending of voted state
		if(this.topic.voted) {
			this.topicService.unvote(this.topicId, this.userId).subscribe(res => {
				this.topic.voted = res.voted;
			});
		} else {
			this.topicService.vote(this.topicId, this.userId).subscribe(res => {
				this.topic.voted = res.voted;
			});
		}
	}
	
	/*private createProposal() {
		this.httpManagerService.post('/json/proposal/create', {'topicId': this.topicId, 'userId': this.userId}).subscribe(res => {
			// Show alert
			//this.alertService.alertFromServer(res.alert);
			
			// Reload topic data
			//this.loadTopic(this.topicId);
			
			// Add activity
			this.activityListService.addActivity(C.ACT_PROPOSAL_CREATED, this.topicId).subscribe();
		});
	}*/
	
	/*
	 * @desc: Open graph to visualize topic hierarchy
	 */
	/*public openGraph() {
		this.showGraph = true;
		//this.groupvis.initGraph(this.topicId);
	}*/

}
