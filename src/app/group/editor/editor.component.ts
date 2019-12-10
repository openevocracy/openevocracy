import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar, MatDialog } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';

import { AlertService } from '../../_services/alert.service';
import { ConnectionAliveService } from '../../_services/connection.service';
import { HttpManagerService } from '../../_services/http-manager.service';
import { UserService } from '../../_services/user.service';
import { EditorService } from '../../_services/editor.service';
import { GroupService } from '../../_services/group.service';

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
export class GroupEditorComponent extends EditorComponent implements OnInit, OnDestroy {
	
	public proposalHtml: string = "";
	public group;
	public me;

  constructor(
		protected snackBar: MatSnackBar,
		protected alertService: AlertService,
		protected router: Router,
		protected activatedRoute: ActivatedRoute,
		protected httpManagerService: HttpManagerService,
		protected userService: UserService,
		protected translateService: TranslateService,
		protected connectionAliveService: ConnectionAliveService,
		protected editorService: EditorService,
		protected dialog: MatDialog,
		private groupService: GroupService
	) {
		super(snackBar, alertService, router, activatedRoute, httpManagerService, userService, translateService, connectionAliveService, editorService, dialog);
		
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
		// Set and translate placeholder
		this.translatePlaceholder("EDITOR_PLACEHOLDER_GROUP");
		
		// Get current groupId
		const groupId = this.router.url.split('/')[2];
		
		// Get group from group service cache
		this.group = this.groupService.getBasicGroupFromCache(groupId);
		
		// If pad is expired or user is not member, redirect to document
		if (this.group.isExpired || !this.group.isMember(this.userId))
			this.router.navigate(['/group', groupId, 'document']);
	}
	
	/*
	 * @desc: Lifecylce hook, used to close socket connection properly if view is destroyed
	 */
	ngOnDestroy() {
		// Close pad socket
		if (this.padSocket)
			this.padSocket.close();
		
		// Stop countdown
		if (this.deadlineInterval)
			clearInterval(this.deadlineInterval);
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
		// Disable editor body
		this.disableEdit();
		
		// Bring toolbar to mat-toolbar
		$(".ql-toolbar").prependTo("#toolbar");
		
		// Set quill editor
		this.quillEditor = editor;
		
		// Add color of current member
		this.me = _.findWhere(this.group.members, { 'userId': this.userId });
		this.quillEditor.getModule('authorship').addAuthor(this.userId, this.me.color);
		
		// Add colors of other members
		_.each(this.group.members, (member) => {
			if(member.userId != this.me.userId)
				this.quillEditor.getModule('authorship').addAuthor(member.userId, member.color);
		});
		
		// Register saved status of editor in editor service
		this.editorService.setIsSaved(this.group.padId, true);
		
		// Initialize socket
		this.initializePadSocket(this.group.docId);
	}

}
