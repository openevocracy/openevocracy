import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { ActivatedRoute, Params } from '@angular/router';
import { MatSnackBar } from '@angular/material';
import { forkJoin } from 'rxjs/observable/forkJoin';

import { HttpManagerService } from '../_services/http-manager.service';

import { faArrowAltCircleLeft, faCaretUp, faCaretDown } from '@fortawesome/free-solid-svg-icons';

import { Thread } from "../_models/forum/thread";
import { Post } from "../_models/forum/post";

import * as _ from 'underscore';

@Component({
	selector: 'app-groupforumthread',
	templateUrl: './groupforumthread.component.html',
	styleUrls: ['./groupforumthread.component.scss']
})
export class GroupForumThreadComponent implements OnInit {
	
	public saving: boolean = false;
	public editor;
	public thread: Thread;
	public posts: Post[];
	
	// FontAwesome icons
	public faArrowAltCircleLeft = faArrowAltCircleLeft;
	public faCaretUp = faCaretUp;
	public faCaretDown = faCaretDown;

	constructor(
		private snackBar: MatSnackBar,
		private translateService: TranslateService,
		private activatedRoute: ActivatedRoute,
		private httpManagerService: HttpManagerService) {
	}
	
	ngOnInit() {
		// Get forum id from url
		this.activatedRoute.params.subscribe((params: Params) => {
			const threadId = params.id;
			this.loadThread(threadId).subscribe();
		});
	}
	
	public loadThread(threadId) {
		// Get current forum information
		return new Observable(observer => {
			this.httpManagerService.get('/json/group/forum/thread/' + threadId).subscribe(res => {
				// Create thread object from thread data
				this.thread = new Thread(res.thread);
				
				// Sort posts by ...
				const sortedPosts = res.posts; //_.sortBy(_.sortBy(withProgress, 'name'), 'progress');
				
				// Initialize posts and construct all elements
				this.posts = [];
				_.each(sortedPosts, function(post) {
					this.posts.push(new Post(post));
				}.bind(this));
				
				// Return to subscribers
				observer.next(true);
			});
		});
	}
	
	public editorCreated(editor: any) {
		this.editor = editor;
	}
	
	public disableNewPostEditor() {
		this.saving = true;
		this.editor.enable(false);
	}
	
	public enableNewPostEditor() {
		this.saving = false;
		this.editor.enable(true);
	}
	
	public submitPost() {
		// Check if form is valid
		if(this.editor.getText().trim() == "")
			return;
			
		// Hide editor while saving
		this.disableNewPostEditor();
		
		// Prepare data
		var data = {
			'html': this.editor.root.innerHTML,
			'threadId': this.thread.threadId,
			'forumId': this.thread.forumId
		};
		
		// Post post to server and create post in database
		this.httpManagerService.post('/json/group/forum/post/create', data).subscribe(res => {
			// Clear editor
			this.editor.setText('');
			
			// Reload page
			this.loadThread(this.thread.threadId).subscribe(() => {
				// After everything is finished, show editor again
				forkJoin(
					this.translateService.get('FORUM_SNACKBAR_NEW_POST'),
					this.translateService.get('FORM_BUTTON_CLOSE'))
				.subscribe(([msg, action]) => {
					// Open snackbar for 3 seconds and save reference
					const snackBarRef = this.snackBar.open(msg, action, {
						'duration': 5000
					});
					
					// After snackbar is closed, redirect show editor again
					snackBarRef.afterDismissed().subscribe(() => {
						this.enableNewPostEditor();
					});
				});
			});
		});
	}

}
