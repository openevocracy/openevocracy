import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { ActivatedRoute, Params } from '@angular/router';
import { MatSnackBar, MatDialog } from '@angular/material';

import { TranslateService } from '@ngx-translate/core';

import { Observable } from 'rxjs';
import { forkJoin } from 'rxjs/observable/forkJoin';

import { ShareDialogComponent } from '../dialogs/share/share.component';

import { HttpManagerService } from '../_services/http-manager.service';
import { UtilsService } from '../_services/utils.service';

import { Thread } from "../_models/forum/thread";
import { Post } from "../_models/forum/post";
import { Comment } from "../_models/forum/comment";

import { faArrowAltCircleLeft, faLock, faCaretUp, faCaretDown, faPenSquare, faTrash, faShareSquare } from '@fortawesome/free-solid-svg-icons';

import * as _ from 'underscore';

@Component({
	selector: 'app-groupforumthread',
	templateUrl: './groupforumthread.component.html',
	styleUrls: ['./groupforumthread.component.scss'],
	encapsulation: ViewEncapsulation.None
})
export class GroupForumThreadComponent implements OnInit {
	
	public saving: boolean = false;
	public commentField: number = -1;
	public fragment: string = "";
	public editor;
	public thread: Thread;
	public posts: Post[];
	
	// FontAwesome icons
	public faArrowAltCircleLeft = faArrowAltCircleLeft;
	public faLock = faLock;
	public faCaretUp = faCaretUp;
	public faCaretDown = faCaretDown;
	public faPenSquare = faPenSquare;
	public faTrash = faTrash;
	public faShareSquare = faShareSquare;

	constructor(
		private router: Router,
		private snackBar: MatSnackBar,
		private matDialog: MatDialog,
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
		
		// Get fragment from url
		this.activatedRoute.fragment.subscribe(fragment => {
			this.fragment = fragment;
			
			// Remoe highlight after 10 seconds
			setTimeout(function() {
				this.fragment = "";
			}.bind(this), 10000);
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
			
			// Scroll to and highlight post, related to created comment
			const relatedPostId = res.ops[0].postId;
			this.navigateToUrlWithFragment(relatedPostId);
			
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
			
			// Scroll to and highlight newly created post
			const submittedPostId = res.insertedIds[0];
			this.navigateToUrlWithFragment(submittedPostId);
			
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
	
	public navigateToUrlWithoutFragment() {
		// Set URL to url of thread
		return this.router.navigate( [this.getUrlwithoutFragment()] );
	}
	
	public navigateToUrlWithFragment(fragment) {
		// Set URL to anchor of post
		return this.router.navigate( [this.getUrlwithoutFragment()], {'fragment': fragment});
	}
	
	public getUrlwithoutFragment() {
		// Split url on hash and only return first part
		return this.router.url.split("#")[0];
	}
	
	public shareThread() {
		this.navigateToUrlWithoutFragment().then(()=>{
		  // Show share dialog after url was set
			this.matDialog.open(ShareDialogComponent);
		});
	}
	
	public editThread() {
		
	}
	
	public deleteThread() {
		
	}
	
	public sharePost(postId) {
		this.navigateToUrlWithFragment(postId).then(()=>{
		  // Show share dialog after url was set
			this.matDialog.open(ShareDialogComponent);
		});
	}
	
	public editPost(postId) {
		
	}
	
	public deletePost(postId) {
		
	}
	
	public editComment(commentId) {
		
	}
	
	public deleteComment(commentId) {
		
	}

}
