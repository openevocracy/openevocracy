import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { ActivatedRoute, Params } from '@angular/router';
import { MatDialog } from '@angular/material';

import { Observable } from 'rxjs';

import { ShareDialogComponent } from '../dialogs/share/share.component';
import { AskDeleteDialogComponent } from '../dialogs/askdelete/askdelete.component';
import { EditForumPostDialogComponent } from '../dialogs/editforumpost/editforumpost.component';
import { EditForumCommentDialogComponent } from '../dialogs/editforumcomment/editforumcomment.component';
import { EditThreadDialogComponent } from '../dialogs/editthread/editthread.component';

import { HttpManagerService } from '../_services/http-manager.service';
import { UtilsService } from '../_services/utils.service';
import { ConfigService } from '../_services/config.service';
import { UserService } from '../_services/user.service';
import { SnackbarService } from '../_services/snackbar.service';

import { Thread } from "../_models/forum/thread";
import { Post } from "../_models/forum/post";
import { Edit } from "../_models/forum/edit";

import { faArrowAltCircleLeft, faLock, faCaretUp, faCaretDown, faPenSquare, faTrash, faShareSquare, faCheckSquare } from '@fortawesome/free-solid-svg-icons';

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
	public solvedButton: string;
	public sortedBy: string = "";
	public sortLabels = {
		'sumVotes': 'FORUM_SORT_LABEL_VOTES',
		'createdTimestamp': 'FORUM_SORT_LABEL_DATE'
	};
	
	// FontAwesome icons
	public faArrowAltCircleLeft = faArrowAltCircleLeft;
	public faLock = faLock;
	public faCaretUp = faCaretUp;
	public faCaretDown = faCaretDown;
	public faPenSquare = faPenSquare;
	public faTrash = faTrash;
	public faShareSquare = faShareSquare;
	public faCheckSquare = faCheckSquare;

	constructor(
		private router: Router,
		private matDialog: MatDialog,
		private utilsService: UtilsService,
		private activatedRoute: ActivatedRoute,
		private httpManagerService: HttpManagerService,
		private configService: ConfigService,
		private userService: UserService,
		private snackbarService: SnackbarService) {
			// Store config
			this.cfg = configService.get();
			
			// Store user id of current user
			this.userId = this.userService.getUserId();
	}
	
	ngOnInit() {
		// Get forum id from url
		this.activatedRoute.params.subscribe((params: Params) => {
			const threadId = params.id;
			this.loadThread(threadId).subscribe(res => {
				// Set solved button label
				this.solvedButton = this.thread.closed ? 'FORUM_BUTTON_MARK_UNSOLVED' : 'FORUM_BUTTON_MARK_SOLVED';
			});
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
	public loadThread(threadId: string) {
		// Get current forum information
		return new Observable(observer => {
			this.httpManagerService.get('/json/group/forum/thread/' + threadId).subscribe(res => {
				// Create thread object from thread data
				this.thread = new Thread(res.thread);
				
				// Initialize posts and construct all elements
				this.posts = [];
				_.each(res.posts, function(post) {
					// Push post instance to posts array
					this.posts.push(new Post(post));
				}.bind(this));
				
				this.sortPosts('createdTimestamp', true, false);
				//this.sortPosts('sumVotes');
				
				console.log(this.posts);
				
				// Return to subscribers
				observer.next(true);
			});
		});
	}
	
	public sortPosts(by: string, reverse: boolean = false, showSnackbar: boolean = true) {
		// Remove and retun first element
		const mainpost = this.posts.shift();
		
		// Sort posts
		this.posts = _.sortBy(this.posts, by).reverse();
		
		// If reverse is true, reorder array
		if (reverse)
			this.posts = this.posts.reverse();
		
		// Add mainpost again as first element
		this.posts.unshift(mainpost);
		
		// Set sort type label
		this.sortedBy = by;
		
		// Show snackbar if flag is set to true
		if (showSnackbar)
			this.snackbarService.showSnackbar('FORUM_SNACKBAR_SORT_CHANGED');
	}
	
	public toggleSolved() {
		const data = {
			'threadId': this.thread.threadId,
			'solved': !this.thread.closed
		};
		
		this.httpManagerService.post('/json/group/forum/thread/solved', data).subscribe(res => {
			if (this.thread.closed) {
				this.thread.closed = false;
				this.solvedButton = 'FORUM_BUTTON_MARK_SOLVED';
				
				// Show snack bar notification
				this.snackbarService.showSnackbar('FORUM_SNACKBAR_MARK_SOLVED');
			} else {
				this.thread.closed = true;
				this.solvedButton = 'FORUM_BUTTON_MARK_UNSOLVED';
				
				// Show snack bar notification
				this.snackbarService.showSnackbar('FORUM_SNACKBAR_MARK_UNSOLVED');
			}
		});
	}
	
	/**
	 * @desc: Wrapper function for vote function, votes for a post
	 */
	public votePost(postId: string, voteValue: number) {
		const post = _.findWhere(this.posts, { 'postId': postId });
		this.vote(postId, post, voteValue);
	}
	
	/**
	 * @desc: Wrapper function for vote function, votes for a comment
	 */
	public voteComment(commentId: string, postId: string, voteValue: number) {
		const post = _.findWhere(this.posts, { 'postId': postId });
		const comment = _.findWhere(post.comments, { 'commentId': commentId });
		this.vote(commentId, comment, voteValue);
	}
	
	/**
	 * @desc: Vote for entity (post or comment)
	 */
	public vote(entityId: string, entity: any, voteValue: number) {
		// Define data to post to server
		const preUserVote = entity.userVote;
		const postUserVote = preUserVote != voteValue ? voteValue : 0
		const data = {
			'userId': this.userId,
			'entityId': entityId,
			'voteValue': postUserVote
		};
		
		// Post vote to server and create vote entity in database
		this.httpManagerService.post('/json/group/forum/vote', data).subscribe(res => {
			// Update entity user vote
			entity.userVote = data.voteValue;
			
			// Update sum of user votes for this entity
			const deltaUserVote = postUserVote - preUserVote;
			entity.sumVotes = entity.sumVotes + deltaUserVote;
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
			// Scroll to and highlight post, related to created comment
			const relatedPostId = res[0].ops[0].postId;
			this.navigateToUrlWithFragment(relatedPostId);
			
			// Reload model
			this.loadThread(this.thread.threadId).subscribe(() => {
				// Show snack bar notification
				this.snackbarService.showSnackbar('FORUM_SNACKBAR_NEW_COMMENT');
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
			
			// FIXME: Scrolling is currently not working, since post is added to DOM afterwards
			//        Either reload page after creation or find another solution for scrolling?
			// Scroll to and highlight newly created post
			const submittedPostId = res[0].insertedIds[0];
			this.navigateToUrlWithFragment(submittedPostId);
			
			// Reload model
			this.loadThread(this.thread.threadId).subscribe(() => {
				// After everything is finished, show snackbar notification and enable editor again
				this.snackbarService.showSnackbar('FORUM_SNACKBAR_NEW_POST', this.enableNewPostEditor.bind(this));
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
					if (post.postId == postId) {
						post.html = up.html;
						post.editHistory.push({ 'createdTimestamp': new Date().getTime(), 'authorId': this.userId });
						console.log(post);
					}
					return post;
				});
				
				// Update topic
				this.thread.title = up.title;
				this.thread.private = up.private;
				
				// Show snack bar notification
				this.snackbarService.showSnackbar('FORUM_SNACKBAR_THREAD_EDITED');
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
				this.snackbarService.showSnackbar('FORUM_SNACKBAR_THREAD_DELETED', function() {
					this.router.navigate(['/group/forum/', this.thread.forumId])
				}.bind(this));
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
					if (post.postId == postId) {
						post.html = updatedPostHtml;
						post.editHistory.push({ 'createdTimestamp': new Date().getTime(), 'authorId': this.userId });
					}
					return post;
				});
				
				// Show snack bar notification
				this.snackbarService.showSnackbar('FORUM_SNACKBAR_POST_EDITED');
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
				this.snackbarService.showSnackbar('FORUM_SNACKBAR_POST_DELETED');
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
							if(comment.commentId == commentId) {
								comment.html = this.textareaToHtml(updatedCommentHtml);
								comment.editHistory.push({ 'createdTimestamp': new Date().getTime(), 'authorId': this.userId });
							}
							return comment;
						});
					}
					return post;
				});
				
				// Show snack bar notification
				this.snackbarService.showSnackbar('FORUM_SNACKBAR_COMMENT_EDITED');
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
				this.snackbarService.showSnackbar('FORUM_SNACKBAR_COMMENT_DELETED');
			});
		});
	}

}
