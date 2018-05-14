import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';

import { HttpManagerService } from '../_services/http-manager.service';
import { UserService } from '../_services/user.service';
import { ModalService } from '../_services/modal.service';
import { CloseeditorModalService } from '../_services/modal.closeeditor.service';

import { EditorComponent } from '../editor/editor.component';

import { Group } from '../_models/group';

import 'quill-authorship';
//import 'quill-cursors';
import * as $ from 'jquery';
import * as _ from 'underscore';

import { C } from '../../../shared/constants';

import { faUser } from '@fortawesome/free-solid-svg-icons';
import { faFile } from '@fortawesome/free-solid-svg-icons';
import { faHandshake } from '@fortawesome/free-solid-svg-icons';
import { faLightbulb } from '@fortawesome/free-solid-svg-icons';
import { faExpandArrowsAlt } from '@fortawesome/free-solid-svg-icons';

import * as QuillNamespace from 'quill';
let Quill: any = QuillNamespace;

import { QuillCursors } from 'quill-cursors';
Quill.register('modules/cursors', QuillCursors);

@Component({
	selector: 'app-group',
	templateUrl: './group.component.html',
	styleUrls: ['../editor/editor.component.scss', './group.component.scss']
})
export class GroupComponent extends EditorComponent implements OnInit {
	private C;
	private uid: string;
	private group: Group;
	
	private faUser = faUser;
	private faExpandArrowsAlt = faExpandArrowsAlt;
	private faFile = faFile;
	private faHandshake = faHandshake;
	private faLightbulb = faLightbulb;
	
	constructor(
		protected router: Router,
		protected activatedRoute: ActivatedRoute,
		protected modalService: ModalService,
		protected closeeditorModalService: CloseeditorModalService,
		protected httpManagerService: HttpManagerService,
		private userService: UserService,) {
		super(router, activatedRoute, modalService, closeeditorModalService, httpManagerService);
		
		this.uid = this.userService.getUserId();
		
		// Initialize authorship module
		this.quillModules = _.extend(this.quillModules,{
			'authorship': { 'enabled': true, 'authorId': this.uid },
			'cursors': true
		});
	}
	
	ngOnInit() {
		this.C = C;
	}
	
	protected editorCreated(editor) {
		// Disable editor body
		this.disableEdit();
		
		// Bring toolbar to mat-toolbar
		$(".ql-toolbar").prependTo("#toolbar");
		
		// Set quill editor
		this.quillEditor = editor;
		
		// Get additional information and initalize socket
		this.activatedRoute.params.subscribe((params: Params) => {
				this.xpid = params.id;
				
				this.httpManagerService.get('/json' + this.router.url).subscribe(res => {
					this.group = new Group(res);
					this.source = res.tid;
					
					// Add color of current member
					var me = _.findWhere(res.members, { '_id': this.uid });
					this.quillEditor.getModule('authorship').addAuthor(this.uid, me.color);
					
					// Add colors of other members
					_.map(res.members, function(member) {
						if(member._id != me._id)
							this.quillEditor.getModule('authorship').addAuthor(member._id, member.color);
					}.bind(this));
					
					/*this.quillEditor.getModule('cursors').set({
						id: me._id,
						name: me.name,
						color: me.color,
						range: 1
					});*/
					
					// Initialize socket
					this.initalizeSocket(res.pid);
				});
			});
	}
	
	private slectionChanged(e) {
		console.log(e.range);
		if (!e.range)
			return;
			
		var me = _.findWhere(this.group.members, { '_id': this.uid });
		
		/*var cursor = {
			'id': me._id,
			'name': me.name,
			'color': me.color,
			'range': e.range
		};
		this.quillEditor.getModule('cursors').setCursor(cursor);*/
		
		// Submit to server ..
	}
	
	private rate(e, ruid, type) {
		var rating = {
			'gid': this.group._id,
			'ruid': ruid,
			'score': e.rating,
			'type': type
		}
		
		this.httpManagerService.post('/json/ratings/rate', rating).subscribe();
	}
	
	private enterFullscreen() {
		var element = document.documentElement;
		
		if(element.requestFullscreen) {
			element.requestFullscreen();
		/*} else if(element.mozRequestFullScreen) {
			element.mozRequestFullScreen();
		} else if(element.msRequestFullscreen) {
			element.msRequestFullscreen();*/
		} else if(element.webkitRequestFullscreen) {
			element.webkitRequestFullscreen();
		}
	}

}
