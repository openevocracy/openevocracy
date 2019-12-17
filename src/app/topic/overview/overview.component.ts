import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar, MatDialog } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';

import { BasicTopic } from '../../_models/topic/basic';
import { TopicOverview } from '../../_models/topic/overview';

//import { GroupvisComponent } from '../../groupvis/groupvis.component';
import { EditorComponent } from '../../editor/editor.component';

import { ConnectionAliveService } from '../../_services/connection.service';
import { EditorService } from '../../_services/editor.service';
import { TopicService } from '../../_services/topic.service';
import { UserService } from '../../_services/user.service';
import { SnackbarService } from '../../_services/snackbar.service';
import { ActivityListService} from '../../_services/activitylist.service';

import * as $ from 'jquery';
import * as _ from 'underscore';

import { C } from '../../../../shared/constants';

import { faUser, faUsers, faFile, faHandPaper } from '@fortawesome/free-solid-svg-icons';

@Component({
	selector: 'app-overview',
	templateUrl: './overview.component.html',
	styleUrls: ['./overview.component.scss']
})
export class TopicOverviewComponent extends EditorComponent {
	
	//@ViewChild(GroupvisComponent)
	//private groupvis: GroupvisComponent;
	
	public C;
	public topicId: string;
	public basicTopic: BasicTopic;
	public topic: TopicOverview;
	public isEditor: boolean = false;
	
	//public showGraph: boolean = false;
	
	public faUser = faUser;
	public faUsers = faUsers;
	public faFile = faFile;
	public faHandPaper = faHandPaper;

	constructor(
		protected snackBar: MatSnackBar,
		protected router: Router,
		protected userService: UserService,
		protected translateService: TranslateService,
		protected connectionAliveService: ConnectionAliveService,
		protected editorService: EditorService,
		protected dialog: MatDialog,
		private snackbarService: SnackbarService,
		private topicService: TopicService,
		private activityListService: ActivityListService
	) {
		super(snackBar, router, userService, translateService, connectionAliveService, editorService, dialog);
		
		this.C = C;
		
		this.loadData();
	}
	
	private loadData() {
		// Get topicId from route
		this.topicId = this.router.url.split('/')[2];
		
		// Get basic topic
		this.basicTopic = this.topicService.getBasicTopicFromList(this.topicId);
		
		// Get topic overview data from server
		this.topicService.getTopicOverview(this.topicId).subscribe(res => {
			this.topic = new TopicOverview(res);
			
			// Show editor if current user is author and current stage is selection stage
			if (this.topic.authorId == this.userId && this.basicTopic.stage == C.STAGE_SELECTION)
				this.isEditor = true;
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
	
	/**
	 * @desc: If not proposal exists for the current user, it can be created using this function
	 * 		 After creation, the user is redirected to the proposal tab (editor)
	 */
	private createProposal() {
		this.topicService.addProposal(this.topicId, this.userId).subscribe((res) => {
			// Change hasProposal value in listed basic topic
			this.topicService.setTopicHasProposal(this.topicId, true);
			
			// Show snackbar
			this.snackbarService.showSnackbar('TOPIC_SNACKBAR_PROPOSAL_CREATED');
			
			// Redirect to proposal editor tab
			this.router.navigate(['/topic', this.topicId, 'proposal']);
			
			// Add activity
			this.activityListService.addActivity(C.ACT_PROPOSAL_CREATED, this.topicId).subscribe();
		});
	}
	
	/*
	 * @desc: Open graph to visualize topic hierarchy
	 */
	/*public openGraph() {
		this.showGraph = true;
		//this.groupvis.initGraph(this.topicId);
	}*/
	
	/*
	 * @desc: Overwrites editorCreated in editor component.
	 *        Mainly gets further information about group from server.
	 *        The function is called from editor component.
	 *
	 * @params:
	 *    editor: quill editor object
	 */
	public editorCreated(editor) {
		// Only go on if editor shall be shown
		if (!this.isEditor)
			return;
			
		// Bind all necessary information to editor
		const quillEditor = _.extend(editor, {
			'docId': this.topic.descDocId,
			'padId': this.topic.descPadId,
			'type': 'docs_topic_description',
			'placeholder': 'EDITOR_PLACEHOLDER_TOPIC_DESCRIPTION',
			'deadline': this.basicTopic.nextDeadline
		});
		
		// Init editor
		this.initializeEditor(quillEditor);
	}
	
	/**
	 * @desc: Updates the component view, when countdown has finished and stage is over
	 */
	public updateView() {
		// Reload basic topic
		this.router.navigate(['/topic', this.topicId]);
	}

}
