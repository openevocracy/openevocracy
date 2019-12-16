import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar, MatDialog } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';

import { BasicTopic } from '../../_models/topic/basic';
import { TopicProposal } from '../../_models/topic/proposal';

import { EditorComponent } from '../../editor/editor.component';

import { ConnectionAliveService } from '../../_services/connection.service';
import { HttpManagerService } from '../../_services/http-manager.service';
import { EditorService } from '../../_services/editor.service';
import { UserService } from '../../_services/user.service';
import { TopicService } from '../../_services/topic.service';

import * as $ from 'jquery';

import { C } from '../../../../shared/constants';

@Component({
	selector: 'app-proposal',
	templateUrl: './proposal.component.html',
	styleUrls: ['./proposal.component.scss']
})
export class TopicProposalComponent extends EditorComponent implements OnInit {
	
	public C;
	public topicId: string;
	public userId: string;
	public proposal: TopicProposal;
	public isEditor: boolean = false;
	public basicTopic: BasicTopic;

	constructor(
		protected snackBar: MatSnackBar,
		protected router: Router,
		protected activatedRoute: ActivatedRoute,
		protected httpManagerService: HttpManagerService,
		protected userService: UserService,
		protected translateService: TranslateService,
		protected connectionAliveService: ConnectionAliveService,
		protected editorService: EditorService,
		protected dialog: MatDialog,
		private topicService: TopicService
	) {
		super(snackBar, router, activatedRoute, httpManagerService, userService, translateService, connectionAliveService, editorService, dialog);
		
		// Get topicId from route
		this.topicId = this.router.url.split('/')[2];
		
		// Get userId from user service
		this.userId = this.userService.getUserId();
		
		// Get basic topic
		this.basicTopic = this.topicService.getBasicTopicFromList(this.topicId);
		
		// Get proposal from server
		this.topicService.getProposalAsync(this.topicId).subscribe((res) => {
			this.proposal = new TopicProposal(res);
			
			if (this.userId == this.proposal.authorId && this.basicTopic.stage == C.STAGE_PROPOSAL)
				this.isEditor = true;
		});
	}
	
	ngOnInit() {
	}
	
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
		
		// Set and translate placeholder
		this.translatePlaceholder("EDITOR_PLACEHOLDER_PROPOSAL");
		
		// Disable editor body
		this.disableEdit();
		
		// Bring toolbar to mat-toolbar
		$(".ql-toolbar").prependTo("#toolbar");
		
		// Set quill editor
		this.quillEditor = editor;
		
		// Register saved status of editor in editor service
		this.editorService.setIsSaved(this.proposal.padId, true);
		
		// Initialize socket
		this.initializePadSocket('docs_proposal', this.proposal.docId);
	}

}
