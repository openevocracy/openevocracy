import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';

import { HttpManagerService } from '../_services/http-manager.service';
import { UserService } from '../_services/user.service';
import { ModalService } from '../_services/modal.service';
import { CloseeditorModalService } from '../_services/modal.closeeditor.service';

import { EditorComponent } from '../editor/editor.component';

import 'quill-authorship';

import * as $ from 'jquery';
import * as _ from 'underscore';

@Component({
	selector: 'app-group',
	templateUrl: './group.component.html',
	styleUrls: ['../editor/editor.component.scss', './group.component.scss']
})
export class GroupComponent extends EditorComponent implements OnInit {
	private uid: string;
	
	constructor(
		protected router: Router,
		protected activatedRoute: ActivatedRoute,
		protected modalService: ModalService,
		protected closeeditorModalService: CloseeditorModalService,
		protected httpManagerService: HttpManagerService,
		private userService: UserService,) {
		super(router, activatedRoute, modalService, closeeditorModalService, httpManagerService);
		
		this.uid = this.userService.getUserId();
		
		this.quillModules = _.extend(this.quillModules,{
			authorship: { 'enabled': true, 'authorId': this.uid }
		});
	}
	
	ngOnInit() {
	}
	
	protected editorCreated(editor, pid) {
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
					this.pid = res.pid;
					this.title = res.title;
					this.source = res.tid;
					
					// Add authors
					// Color of current member
					var me = _.findWhere(res.members, { '_id': this.uid });
					this.quillEditor.theme.modules.authorship.options.color = me.color;
					// Colors of other members
					_.map(res.members, function(member) {
						if(member._id != me._id)
							this.quillEditor.theme.modules.authorship.addAuthor(member._id, member.color);
					});
					//this.quillEditor.theme.modules.authorship.addAuthor(1, '#0f0');
					console.log(this.quillEditor);
					
					// Initialize socket
					this.initalizeSocket(this.pid);
				});
			});
	}

}
