import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar, MatDialog } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';

import { ConnectionAliveService } from '../../_services/connection.service';
import { UserService } from '../../_services/user.service';
import { EditorService } from '../../_services/editor.service';
import { GroupService } from '../../_services/group.service';
import { SnackbarService } from '../../_services/snackbar.service';

import { EditorComponent } from '../../editor/editor.component';

import 'quill-authorship-evo';
import * as $ from 'jquery';
import * as _ from 'underscore';

import { C } from '../../../../shared/constants';

@Component({
	selector: 'app-editor',
	templateUrl: './editor.component.html',
	styleUrls: ['../../editor/editor.component.scss', './editor.component.scss']
})
export class GroupEditorComponent extends EditorComponent implements OnInit {
	
	public proposalHtml: string = "";
	public group;
	public me;

  constructor(
		protected snackBar: MatSnackBar,
		protected router: Router,
		protected userService: UserService,
		protected translateService: TranslateService,
		protected connectionAliveService: ConnectionAliveService,
		protected editorService: EditorService,
		protected dialog: MatDialog,
		private groupService: GroupService
	) {
		super(snackBar, router, userService, translateService, connectionAliveService, editorService, dialog);
		
		// Initialize authorship module
		this.quillModules = _.extend(this.quillModules,{
			'authorship': { 'enabled': true, 'authorId': this.userId }
		});
		
		/*this.quillEditor.getModule('cursors').set({
			id: this.me.userId,
			name: this.me.name,
			color: this.me.color,
			range: 1
		});*/
	}
	
	/*
	 * @desc: Lifecylce hook, used to set constants initially
	 */
	ngOnInit() {
		// Get current groupId
		const groupId = this.router.url.split('/')[2];
		
		// Get group from group service cache
		this.group = this.groupService.getBasicGroupFromCache(groupId);
		
		// If pad is expired or user is not member, redirect to document
		if (this.group.isExpired || !this.group.isMember(this.userId))
			this.router.navigate(['/group', groupId, 'document']);
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
		
		// Bind all necessary information to editor
		const quillEditor = _.extend(editor, {
			'docId': this.group.docId,
			'padId': this.group.padId,
			'type': 'docs_group',
			'placeholder': 'EDITOR_PLACEHOLDER_GROUP',
			'deadline': this.group.expiration
		});
		
		// Add color of current member
		this.me = _.findWhere(this.group.members, { 'userId': this.userId });
		quillEditor.getModule('authorship').addAuthor(this.userId, this.me.color);
		
		// Add colors of other members
		_.each(this.group.members, (member) => {
			if(member.userId != this.me.userId)
				quillEditor.getModule('authorship').addAuthor(member.userId, member.color);
		});
		
		// Initialize socket
		this.initializeEditor(quillEditor);
	}
	
	/**
	 * @desc: Updates the component view, when countdown has finished and stage is over
	 */
	public updateView() {
		// When group is finished, navigate to group again
		this.router.navigate(['/group', this.group.groupId]);
	}

}
