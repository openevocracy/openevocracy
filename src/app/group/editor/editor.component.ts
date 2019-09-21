import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';

import { AlertService } from '../../_services/alert.service';
import { HttpManagerService } from '../../_services/http-manager.service';
import { UserService } from '../../_services/user.service';
import { ModalService } from '../../_services/modal.service';
import { CloseeditorModalService } from '../../_services/modal.closeeditor.service';

import { EditorComponent } from '../../editor/editor.component';

import 'quill-authorship-evo';
import * as $ from 'jquery';
import * as _ from 'underscore';

import { C } from '../../../../shared/constants';

import { faTimes } from '@fortawesome/free-solid-svg-icons';

@Component({
	selector: 'app-editor',
	templateUrl: './editor.component.html',
	styleUrls: ['../../editor/editor.component.scss', './editor.component.scss']
})
export class GroupEditorComponent extends EditorComponent implements OnInit, OnDestroy {
	
	public proposalHtml: string = "";
	public members;
	public me;
	
	// Classes and styles for member proposal column
	/*public classColEditor: string = 'col-xs-12';
	public classColProposal: string = 'hidden';
	public styleColProposal = {'background-color': '#fff'};*/
	
	// FontAwesome icons
	public faTimes = faTimes;

  constructor(
		protected snackBar: MatSnackBar,
		protected alertService: AlertService,
		protected router: Router,
		protected activatedRoute: ActivatedRoute,
		protected modalService: ModalService,
		protected closeeditorModalService: CloseeditorModalService,
		protected httpManagerService: HttpManagerService,
		protected userService: UserService,
		protected translateService: TranslateService
	) {
		super(snackBar, alertService, router, activatedRoute, modalService, closeeditorModalService, httpManagerService, userService, translateService);
		
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
	}
	
	/*
	 * @desc: Lifecylce hook, used to close socket connection properly if view is destroyed
	 */
	ngOnDestroy() {
		this.manualClose = true;
		// Close pad socket
		if (this.padSocket)
			this.padSocket.close();
		
		// Unsubscribe to avoid memory leak
		this.modalSubscription.unsubscribe();
		
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
		
		// Get current groupId
		const groupId = this.router.url.split('/')[2];
		
		// Get additional information and initalize socket
		this.httpManagerService.get('/json/group/editor/' + groupId).subscribe((res) => {
			this.members = res.members
			
			// Add color of current member
			this.me = _.findWhere(res.members, { 'userId': this.userId });
			this.quillEditor.getModule('authorship').addAuthor(this.userId, this.me.color);
			
			// Add colors of other members
			_.map(this.members, (member) => {
				if(member.userId != this.me.userId)
					this.quillEditor.getModule('authorship').addAuthor(member.userId, member.color);
			});
			
			// Initialize countdown
			this.initCountdown(res.deadline);
			
			// Initialize socket
			this.initalizePadSocket(res.docId);
		});
	}
	
	/*
	 * @desc: Opens a member proposal
	 */
	/*private openMemberProposal(html: string, color: string) {
		this.classColEditor = 'col-xs-6';
		this.classColProposal = 'col-xs-6';
		this.styleColProposal = {'background-color': color};
		this.proposalHtml = html;
	}*/
	
	/*
	 * @desc: When a member proposal was open and user closes or
	 *        chooses antoher member proposal, this function is called
	 *        in order to close the particular member proposal. 
	 */
	/*public closeMemberProposal() {
		this.classColEditor = 'col-xs-12';
		this.classColProposal = 'hidden';
		this.proposalHtml = "";
	}*/
	
	/*
	 * @desc: Posts rating of user to server
	 *
	 * @params:
	 *    e:           event (given by rate component)
	 *    ratedUserId: user which was rated
	 *    type:        type of rating (e.g. default message, online message)
	 */
	/*private rate(e, ratedUserId, type) {
		// Do not post new rating to server, if the new rating is equal to the old rating
		var ratedMember = _.findWhere(this.group.members, {'userId': ratedUserId});
		if(type == C.RATING_INTEGRATION && ratedMember.ratingIntegration == e.rating)
			return;
		if(type == C.RATING_KNOWLEDGE && ratedMember.ratingKnowledge == e.rating)	
			return;
			
		// Post rating to server
		var rating = {	'groupId': this.group.groupId, 'ratedUserId': ratedUserId, 'score': e.rating, 'type': type };
		this.httpManagerService.post('/json/ratings/rate', rating).subscribe();
	}*/
	
	/*
	 * @desc: Opens 'productive mode'
	 */
	/*public enterFullscreen() {
		var element = document.documentElement;
		
		if(element.requestFullscreen) {
			element.requestFullscreen();
		/*} else if(element.mozRequestFullScreen) {
			element.mozRequestFullScreen();
		} else if(element.msRequestFullscreen) {
			element.msRequestFullscreen();/
		} else if(element.webkitRequestFullscreen) {
			element.webkitRequestFullscreen();
		}
	}*/

}
