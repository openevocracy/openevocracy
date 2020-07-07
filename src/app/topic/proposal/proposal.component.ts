import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar, MatDialog } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';

import { BasicTopic } from '../../_models/topic/basic';
import { TopicProposal } from '../../_models/topic/proposal';

import { EditorComponent } from '../../editor/editor.component';

import { ConnectionAliveService } from '../../_services/connection.service';
import { UserService } from '../../_services/user.service';
import { TopicService } from '../../_services/topic.service';
import { SnackbarService } from '../../_services/snackbar.service';
import { UtilsService } from '../../_services/utils.service';
import { ConfigService } from '../../_services/config.service';

import { EditorService } from '../../_editor/editor.service';

import * as $ from 'jquery';
import * as _ from 'underscore';

import { C } from '../../../../shared/constants';

import { faCheckCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';

@Component({
	selector: 'app-proposal',
	templateUrl: './proposal.component.html',
	styleUrls: ['./proposal.component.scss']
})
export class TopicProposalComponent extends EditorComponent {
	
	public C;
	public cfg;
	public topicId: string;
	public proposal: TopicProposal;
	public editor;
	public isEditor: boolean = false;
	public basicTopic: BasicTopic;
	public isValid: boolean = false;
	
	//public valid_tooltip : string;
	//public nonvalid_tooltip : string;
	
	public faCheckCircle = faCheckCircle;
	public faTimesCircle = faTimesCircle;

	constructor(
		protected snackBar: MatSnackBar,
		protected router: Router,
		protected userService: UserService,
		protected translateService: TranslateService,
		protected connectionAliveService: ConnectionAliveService,
		protected editorService: EditorService,
		protected dialog: MatDialog,
		private topicService: TopicService,
		private utilsService: UtilsService,
		private configService: ConfigService
	) {
		super(snackBar, router, userService, translateService, connectionAliveService, editorService, dialog);
		
		this.C = C;
		this.cfg = configService.get();
		
		// Get topicId from route
		this.topicId = this.router.url.split('/')[2];
		
		// Get basic topic
		this.basicTopic = this.topicService.getBasicTopicFromList(this.topicId);
		
		// Get proposal from server
		this.topicService.getProposalAsync(this.topicId).subscribe((res) => {
			this.proposal = new TopicProposal(res);
			
			if (this.userId == this.proposal.authorId && this.basicTopic.stage == C.STAGE_PROPOSAL)
				this.isEditor = true;
		});
		
		// Translate tooltip texts
		//this.translate.get("EDITOR_DOCUMENT_VALID_HELPTEXT").
		//		subscribe(str => { this.valid_tooltip = str; });
		//this.translate.get("EDITOR_DOCUMENT_NONVALID_HELPTEXT").
		//		subscribe(str => { this.nonvalid_tooltip = str; });
	}
	
	/*
	 * @desc: Extends the editor and initializes pad socket connection
	 *
	 * @params:
	 *    editor: quill editor object
	 */
	public editorCreated(editor) {
		// Only go on if editor shall be shown
		if (!this.isEditor)
			return;
			
		// Bind all necessary information to editor
		this.editor = _.extend(editor, {
			'docId': this.proposal.docId,
			'padId': this.proposal.padId,
			'type': 'docs_proposal',
			'placeholder': 'EDITOR_PLACEHOLDER_PROPOSAL',
			'deadline': this.basicTopic.nextDeadline
		});
		
		// On every text change, check if document is valid
		this.editor.on('text-change', (delta, oldDelta, source) => {
			this.isValid = this.isProposalValid();
		});
		
		// Init editor
		this.initializeEditor(this.editor);
	}
	
	/**
	 * @desc: Checks if a proposal is valid
	 */
	public isProposalValid(): boolean {
		// Get raw text from editor
		const text = this.editor.getText();
		// Count number of containing words
		const numWords = this.utilsService.countStringWords(text);
		// Return if proposal is valid or not
		return (numWords >= this.cfg.MIN_WORDS_PROPOSAL);
	}
	
	/**
	 * @desc: Updates the component view, when countdown has finished and stage is over
	 */
	public updateView() {
		// Reload basic topic
		this.router.navigate(['/topic', this.topicId]);
	}

}
