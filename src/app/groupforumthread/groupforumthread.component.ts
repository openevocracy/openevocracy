import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { ActivatedRoute, Params } from '@angular/router';
import { MatSnackBar } from '@angular/material';
import { forkJoin } from 'rxjs/observable/forkJoin';

import { HttpManagerService } from '../_services/http-manager.service';
import { UtilsService } from '../_services/utils.service';

import { faArrowAltCircleLeft, faCaretUp, faCaretDown } from '@fortawesome/free-solid-svg-icons';

import { Thread } from "../_models/forum/thread";
import { Post } from "../_models/forum/post";
import { Comment } from "../_models/forum/comment";

import * as _ from 'underscore';

@Component({
	selector: 'app-groupforumthread',
	templateUrl: './groupforumthread.component.html',
	styleUrls: ['./groupforumthread.component.scss']
})
export class GroupForumThreadComponent implements OnInit {
	
	public saving: boolean = false;
	public commentField: number = -1;
	public editor;
	public thread: Thread;
	public posts: Post[];
	
	// FontAwesome icons
	public faArrowAltCircleLeft = faArrowAltCircleLeft;
	public faCaretUp = faCaretUp;
	public faCaretDown = faCaretDown;

	constructor(
		private snackBar: MatSnackBar,
		private utilsService: UtilsService,
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
				
				// TODO Sort posts by ...
				const sortedPosts = res.posts; //_.sortBy(_.sortBy(withProgress, 'name'), 'progress');
				
				// Initialize posts and construct all elements
				this.posts = [];
				_.each(sortedPosts, function(post) {
					// Create post instance
					let postInstance = new Post(post);
					
					// TODO Sort comments by ...
					const sortedComments = postInstance.comments; //_.sortBy(_.sortBy(withProgress, 'name'), 'progress');
					
					// Replace post comments with instances of comments
					postInstance.comments = _.map(sortedComments, function(comment) {
						return new Comment(comment);
					});
					
					// Push post (including comments) to posts array
					this.posts.push(postInstance);
				}.bind(this));
				
				console.log(this.posts);
				
				// Return to subscribers
				observer.next(true);
			});
		});
	}
	
	public editorCreated(editor: any) {
		this.editor = editor;
	}
	
	public showCommentField(idx) {
		this.commentField = idx;
	}
	
	public hideCommentField() {
		this.commentField = -1;
	}
	
	public submitComment(post) {
		const comment = post.newComment;
		
		// Check if textarea is undefined or empty
		if(_.isUndefined(comment) || comment.trim() == "")
			return;
			
		// Close textarea
		this.hideCommentField();
		
		// Define data
		var data = {
			'text': this.utilsService.stripHtml(comment),
			'postId': post.postId,
			'threadId': post.threadId,
			'forumId': post.forumId
		};
		
		// Post comment to server and create comment in database
		this.httpManagerService.post('/json/group/forum/comment/create', data).subscribe(res => {
			console.log(res);
			
			// Reload model
			this.loadThread(this.thread.threadId).subscribe(() => {
				// After everything is finished, show editor again
				forkJoin(
					this.translateService.get('FORUM_SNACKBAR_NEW_COMMENT'),
					this.translateService.get('FORM_BUTTON_CLOSE'))
				.subscribe(([msg, action]) => {
					// Open snackbar for 3 seconds and save reference
					const snackBarRef = this.snackBar.open(msg, action, {
						'duration': 5000
					});
				});
			});
		});
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
		// Check if editor is empty
		if(this.editor.getText().trim() == "")
			return;
			
		// Hide editor while saving
		this.disableNewPostEditor();
		
		// Define data
		var data = {
			'html': this.editor.root.innerHTML,
			'threadId': this.thread.threadId,
			'forumId': this.thread.forumId
		};
		
		// Post post to server and create post in database
		this.httpManagerService.post('/json/group/forum/post/create', data).subscribe(res => {
			// Clear editor
			this.editor.setText('');
			
			// Reload model
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
