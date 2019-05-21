import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { ActivatedRoute, Params } from '@angular/router';
import { MatSnackBar, MatDialog } from '@angular/material';

import { TranslateService } from '@ngx-translate/core';

import { Observable } from 'rxjs';
import { forkJoin } from 'rxjs/observable/forkJoin';

import { ShareDialogComponent } from '../dialogs/share/share.component';
import { AskDeleteDialogComponent } from '../dialogs/askdelete/askdelete.component';
import { EditForumPostDialogComponent } from '../dialogs/editforumpost/editforumpost.component';
import { EditForumCommentDialogComponent } from '../dialogs/editforumcomment/editforumcomment.component';
import { EditThreadDialogComponent } from '../dialogs/editthread/editthread.component';

import { HttpManagerService } from '../_services/http-manager.service';
import { UtilsService } from '../_services/utils.service';
import { ConfigService } from '../_services/config.service';
import { UserService } from '../_services/user.service';

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
	
	public cfg: any;
	public saving: boolean = false;
	public commentField: number = -1;
	public fragment: string = "";
	public editor;
	public userId: string;
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
		private httpManagerService: HttpManagerService,
		private configService: ConfigService,
		private userService: UserService) {
			// Store config
			this.cfg = configService.get();
			
			// Store user id of current user
			this.userId = this.userService.getUserId();
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
			
			// Remove highlight after 10 seconds
			setTimeout(function() {
				this.fragment = "";
			}.bind(this), 10000);
		});
	}
	
	/**
	 * @desc: Sends a get request for the whole thread
	 */
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
	
	/**
	 * @desc: Called when Quill editor is ready
	 */
	public editorCreated(editor: any) {
		this.editor = editor;
	}
	
	/**
	 * @desc: Visually shows the comment textarea for writing a new comment
	 */
	public showCommentField(idx) {
		this.commentField = idx;
	}
	
	/**
	 * @desc: Visually hides the comment textarea for writing a new comment
	 */
	public hideCommentField() {
		this.commentField = -1;
	}
	
	/**
	 * @desc: Sends a post request to the server when the user has written a new comment
	 */
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
				// Show snack bar notification
				this.showSnackBar('FORUM_SNACKBAR_NEW_COMMENT');
			});
		});
	}
	
	/**
	 * @desc: Visually disables the editor which allows writing a post
	 */
	public disableNewPostEditor() {
		this.saving = true;
		this.editor.enable(false);
	}
	
	/**
	 * @desc: Visually enables the editor which allows writing a post
	 */
	public enableNewPostEditor() {
		this.saving = false;
		this.editor.enable(true);
	}
	
	/**
	 * @desc: Show snackbar notification
	 */
	public showSnackBar(title, afterDismissed?) {
		forkJoin(
			this.translateService.get(title),
			this.translateService.get('FORM_BUTTON_CLOSE'))
		.subscribe(([msg, action]) => {
			// Open snackbar for 5 seconds
			const snackBarRef = this.snackBar.open(msg, action, {
				'duration': 5000
			});
			// If afterDismissed callback was given as argument, call function after dismiss
			if (afterDismissed) {
				snackBarRef.afterDismissed().subscribe(() => {
					afterDismissed();
				});
			}
		});
	}
	
	/**
	 * @desc: Sends a post request to the server, when user has written a new post
	 */
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
				// After everything is finished, show snackbar notification and enable editor again
				this.showSnackBar('FORUM_SNACKBAR_NEW_POST', this.enableNewPostEditor.bind(this));
			});
		});
	}
	
	/**
	 * @desc: Navigate to current URL, but without fragment (everything removed after '#')
	 */
	public navigateToUrlWithoutFragment() {
		// Set URL to url of thread
		return this.router.navigate( [this.getUrlwithoutFragment()] );
	}
	
	/**
	 * @desc: Navigate to current URL, but with other fragment (after '#')
	 */
	public navigateToUrlWithFragment(fragment) {
		// Set URL to anchor of post
		return this.router.navigate( [this.getUrlwithoutFragment()], {'fragment': fragment});
	}
	
	/**
	 * @desc: Removes the fragment from URL (everything after '#')
	 */
	public getUrlwithoutFragment() {
		// Split url on hash and only return first part
		return this.router.url.split("#")[0];
	}
	
	/**
	 * @desc: Opens the share dialog and shows share link for the thread
	 */
	public shareThread() {
		this.navigateToUrlWithoutFragment().then(()=>{
		  // Show share dialog after url was set
			this.matDialog.open(ShareDialogComponent);
		});
	}
	
	/**
	 * @desc: Sends a patch request when user edits a thread
	 */
	public editThread(postId, postHtml) {
		// Open thread editor
		const options = { 'data': { 'mainPostHtml': postHtml, 'thread': this.thread }, 'minWidth': '400px' };
		const editRef = this.matDialog.open(EditThreadDialogComponent, options);
		
		// If dialog was approved, get new post and send it to server
		editRef.componentInstance.onSubmit.subscribe(updatedThreadAndPost => {
			const up = updatedThreadAndPost;
			const data = {
				'updatedThread': { 'threadId': this.thread.threadId, 'title': up.title, 'private': up.private },
				'updatedPost': { 'postId': postId, 'html': up.html }
			};
			
			// Send data to server
			this.httpManagerService.patch('/json/group/forum/thread/'+this.thread.threadId, data).subscribe(res => {
				// Update edited post from posts array
				this.posts = _.map(this.posts, (post) => {
					if (post.postId == postId)
						post.html = up.html;
					return post;
				});
				
				// Update topic
				this.thread.title = up.title;
				this.thread.private = up.private;
				
				// Show snack bar notification
				this.showSnackBar('FORUM_SNACKBAR_THREAD_EDITED');
			});
		});
	}
	
	/**
	 * @desc: Sends a delete request when user deletes a whole thread
	 */
	public deleteThread() {
		// Open dialog and ask if thread should really be deleted
		const deleteRef = this.matDialog.open(AskDeleteDialogComponent, { 'data': { 'deleteDescription': 'FORUM_DIALOG_DELETE_THREAD_TEXT' } });
		
		// If dialog was approved, delete thread
		deleteRef.componentInstance.onSubmit.subscribe(() => {
			this.httpManagerService.delete('/json/group/forum/thread/'+this.thread.threadId).subscribe(res => {
				// After everything is finished, show snackbar notification and redirect to forum list
				this.showSnackBar('FORUM_SNACKBAR_THREAD_DELETED', function() {
					this.router.navigate(['/group/forum/', this.thread.forumId])
				});
			});
		});
	}
	
	/**
	 * @desc: Opens the share dialog and shows share link for specific post
	 */
	public sharePost(postId) {
		this.navigateToUrlWithFragment(postId).then(()=>{
			// Show share dialog after url was set
			this.matDialog.open(ShareDialogComponent);
		});
	}
	
	/**
	 * @desc: Sends a patch request when user deletes a post
	 */
	public editPost(postId, postHtml) {
		// Open dialog with editor
		const options = { 'data': { 'postHtml': postHtml }, 'minWidth': '400px' };
		const editRef = this.matDialog.open(EditForumPostDialogComponent, options);
		
		// If dialog was approved, get new post and send it to server
		editRef.componentInstance.onSubmit.subscribe(updatedPostHtml => {
			// Prepare data to send (updated post content)
			const data = { 'updatedPostHtml': updatedPostHtml };
			// Send data to server
			this.httpManagerService.patch('/json/group/forum/post/'+postId, data).subscribe(res => {
				// Change edited post from posts array
				this.posts = _.map(this.posts, (post) => {
					if (post.postId == postId)
						post.html = updatedPostHtml;
					return post;
				});
				
				// Show snack bar notification
				this.showSnackBar('FORUM_SNACKBAR_POST_EDITED');
			});
		});
	}
	
	/**
	 * @desc: Sends a delete request when user deletes a whole post
	 */
	public deletePost(postId) {
		// Open dialog and ask if post should really be deleted
		const deleteRef = this.matDialog.open(AskDeleteDialogComponent, { 'data': { 'deleteDescription': 'FORUM_DIALOG_DELETE_POST_TEXT' } });
	
		// If dialog was approved, delete post
		deleteRef.componentInstance.onSubmit.subscribe(() => {
			this.httpManagerService.delete('/json/group/forum/post/'+postId).subscribe(res => {
				// Remove deleted post from posts array
				this.posts = _.reject(this.posts, (post) => {
					return post.postId == postId;
				});
				
				// Show snack bar notification
				this.showSnackBar('FORUM_SNACKBAR_POST_DELETED');
			});
		});
	}
	
	/**
	 * @desc: Helper function to strip html
	 */
	public stripHtml(htmlString) {
		return htmlString.replace(/<(?:.|\n)*?>/gm, '');
	};
	
	/**
	 * @desc: Helper function to convert textarea content to html
	 */
	public textareaToHtml(str) {
		// First strip html, then add <p> and replace \n by <br/>
		return '<p>'+this.stripHtml(str).replace(/\n/g, '<br/>')+'</p>';
	}
	
	/**
	 * @desc: Sends a patch request when user edits a comment
	 */
	public editComment(postId, comment) {
		// Define comment id
		const commentId = comment.commentId;
		
		// Replace comment text by textarea text
		const textareaContent = comment.html.replace(/<br\/>/g, '\n').replace('<p>', '').replace('</p>', '');
		
		// Open dialog with textarea
		const options = { 'data': { 'comment': textareaContent }, 'minWidth': '400px' };
		const editRef = this.matDialog.open(EditForumCommentDialogComponent, options);
		
		// If dialog was approved, get new comment and send it to server
		editRef.componentInstance.onSubmit.subscribe(updatedCommentHtml => {
			// Prepare data to send (updated comment content)
			const data = { 'updatedCommentHtml': updatedCommentHtml };
			// Send data to server
			this.httpManagerService.patch('/json/group/forum/comment/'+commentId, data).subscribe(res => {
				// Change edited post from posts array
				this.posts = _.map(this.posts, (post) => {
					if (post.postId == postId) {
						post.comments = _.map(post.comments, (comment) => {
							if(comment.commentId == commentId)
								comment.html = this.textareaToHtml(updatedCommentHtml);
							return comment;
						});
					}
					return post;
				});
				
				// Show snack bar notification
				this.showSnackBar('FORUM_SNACKBAR_COMMENT_EDITED');
			});
		});
	}
	
	/**
	 * @desc: Sends a delete request when user deletes a comment
	 */
	public deleteComment(postId, commentId) {
		// Open dialog and ask if comment should really be deleted
		const deleteRef = this.matDialog.open(AskDeleteDialogComponent, { 'data': { 'deleteDescription': 'FORUM_DIALOG_DELETE_COMMENT_TEXT' } });
		
		// If dialog was approved, delete comment
		deleteRef.componentInstance.onSubmit.subscribe(() => {
			this.httpManagerService.delete('/json/group/forum/comment/'+commentId).subscribe(res => {
				// Remove deleted comment from posts array
				_.each(this.posts, (post) => {
					if (post.postId == postId) {
						post.comments = _.reject(post.comments, (comment) => {
							return comment.commentId == commentId;
						});
					}
				});
				
				// Show snack bar notification
				this.showSnackBar('FORUM_SNACKBAR_COMMENT_DELETED');
			});
		});
	}

}
