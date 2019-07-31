import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { MatDialog } from "@angular/material";

import { CountdownComponent } from '../countdown/countdown.component';
import { GroupvisComponent } from '../groupvis/groupvis.component';
import { ShareDialogComponent } from '../dialogs/share/share.component';

import { HttpManagerService } from '../_services/http-manager.service';
import { AlertService } from '../_services/alert.service';
import { TopicService } from '../_services/topic.service';
import { UserService } from '../_services/user.service';
import { ActivityListService} from '../_services/activitylist.service';

import { C } from '../../../shared/constants';
import * as _ from 'underscore';

import { Topic } from '../_models/topic/topic';

import { faHandPaper, faEllipsisV, faUser, faShareSquare, faDownload, faFile, /*faFileMedical, */ faSitemap, faSave, faEdit, faUsers } from '@fortawesome/free-solid-svg-icons';

@Component({
	selector: 'app-topic',
	templateUrl: './topic.component.html',
	styleUrls: ['./topic.component.scss']
})
export class TopicComponent implements OnInit {
	//@ViewChild(GroupvisComponent)
	//private groupvis: GroupvisComponent;
	
	public showGraph: boolean = false;
	
	public C;
	public userId: string;
	public topicId: string;
	public topic: Topic;
	
	public faHandPaper = faHandPaper;
	public faEllipsisV = faEllipsisV;
	public faUser = faUser;
	public faShareSquare = faShareSquare;
	public faDownload = faDownload;
	public faFileMedical = faFile;
	public faSitemap = faSitemap;
	public faSave = faSave;
	public faEdit = faEdit;
	public faUsers = faUsers;
	
	constructor(
		private router: Router,
		private matDialog: MatDialog,
		private alertService: AlertService,
		private topicService: TopicService,
		private userService: UserService,
		private activatedRoute: ActivatedRoute,
		private activityListService: ActivityListService,
		private httpManagerService: HttpManagerService) {}
	
   ngOnInit() {
		this.C = C;
		this.userId = this.userService.getUserId();
		
		this.activatedRoute.params.subscribe(
			(params: Params) => this.topicId = params['id']);
		
		this.loadTopic(this.topicId);
	}
	
	public openDialog() {
		this.matDialog.open(ShareDialogComponent);
	}
	
	private loadTopic(topicId) {
		this.topicService.getTopic(topicId).subscribe(res => {
			this.topic = new Topic(res);
		});
	}
	
	private openEditor(pid) {
		// Redirect to editor view
		this.router.navigate(['/editor/', pid]);
	}
	
	private createProposal() {
		this.httpManagerService.post('/json/proposal/create', {'topicId': this.topicId, 'userId': this.userId}).subscribe(res => {
			// Show alert
			this.alertService.alertFromServer(res.alert);
			
			// Reload topic data
			this.loadTopic(this.topicId);
			
			// Add activity
			this.activityListService.addActivity(C.ACT_PROPOSAL_CREATED, this.topicId).subscribe(res => {
					if (!res)
					{
						console.log("Error: ACT_PROPOSAL_CREATED could not be added.");
					}
			});
		});
	}
	
	private toggleVote() {
		// Vote or unvote, depending of voted state
		if(this.topic.voted) {
			this.topicService.unvote(this.topic._id, this.userId).subscribe(res => {
				this.topic.voted = res.voted;
				this.topic.numVotes--;
			});
		} else {
			this.topicService.vote(this.topic._id, this.userId).subscribe(res => {
				this.topic.voted = res.voted;
				this.topic.numVotes++;
			});
		}
	}
	
	/*
	 * @desc: Open graph to visualize topic hierarchy
	 */
	public openGraph() {
		this.showGraph = true;
		//this.groupvis.initGraph(this.topicId);
	}
	
	/*
	 * @desc: Download final document as pdf (open in new tab)
	 */
	private downloadPdf() {
		this.topicService.downloadResultPdf(this.topicId);
	}

}
