// General libraries
const _ = require('underscore');
const ObjectId = require('mongodb').ObjectID;
const Promise = require('bluebird');

// Import routes
const cfg = require('../../../shared/config').cfg;
const db = require('../../database').db;
const utils = require('../../utils');
const groups = require('../groups');
const users = require('../users');
const helper = require('./helper');

/*
 * @desc: Creates new thread in forum of specific group
 */
exports.create = function(req, res) {
	const authorId = ObjectId(req.user._id);
	const body = req.body;
	const forumId = ObjectId(body.forumId);
	
	// Generate threadId and mainPostId
	const threadId = ObjectId();
	const mainPostId = ObjectId();
	
	// Define thread
	const thread = {
		'_id': threadId,
		'mainPostId': mainPostId,
		'forumId': forumId,
		'authorId': authorId,
		'title': body.title,
		'private': body.private,
		'closed': false,
		'citationId': null,
		'views': 0
	};
	
	// Store thread in database
	const thread_promise = db.collection('forum_threads').insertAsync(thread);
	
	// Define main post
	const post = {
		'_id': mainPostId,
		'threadId': threadId,
		'forumId': forumId,
		'authorId': authorId,
		'html': body.html
	};
	
	// Store main post in database
	const post_promise = db.collection('forum_posts').insertAsync(post);
	
	// Send email to all users who are watching the thread, exept the author
	const notifyUsers_promise = db.collection('groups')
		.findOneAsync({ 'forumId': forumId }, { 'name': true }).then((group) => {
			
			// Build link to forum and thread
			const urlToForum = cfg.PRIVATE.BASE_URL+'/group/forum/'+forumId;
			const urlToThread = cfg.PRIVATE.BASE_URL+'/group/forum/thread/'+threadId;
			
			// Define parameter for email body
			const bodyParams = [ groups.helper.generateMemberName(group._id, authorId), group.name, urlToThread, urlToForum ];
			
			// Define email translation strings
			const mail = {
				'subject': 'EMAIL_NEW_THREAD_CREATED_SUBJECT', 'subjectParams': [],
				'body': 'EMAIL_NEW_THREAD_CREATED_BODY', 'bodyParams': bodyParams
			};
			
			// Finally, send email to watching users
			return helper.sendMailToWatchingUsersAsync(forumId, authorId, mail);
	});
	
	
	// Add author to email notification for this thread
	const notifyAddAuthor_promise = users.enableEmailNotifyAsync(authorId, threadId);
	
	// Wait for promises and send response
	Promise.join(thread_promise, post_promise, notifyUsers_promise, notifyAddAuthor_promise).spread(function(thread, post) {
		return { 'thread': thread, 'post': post };
	}).then(res.json.bind(res));
};

/**
 * @desc: Query thread of specific forum of specific group
 */
exports.query = function(req, res) {
	const userId = ObjectId(req.user._id);
	const threadId = ObjectId(req.params.id);
	
	// Get email notification status of user for this thread
	const notifyStatus_promise = users.getEmailNotifyStatusAsync(userId, threadId);
	
	// Get thread and extend it by notify status
	const thread_promise = notifyStatus_promise.then(function(notifyStatus) {
		return db.collection('forum_threads')
			.findOneAsync({'_id': threadId}).then(function(thread) {
				// Extend thread by notify status
				return _.extend(thread, { 'notifyStatus': notifyStatus });
		});
	}); 
	
	// Get group
	const group_promise = thread_promise.then((thread) => {
		return db.collection('groups').findOneAsync({'forumId': thread.forumId});
	});
	
	// Check if current user is member of group and return boolean (important for functionality of private threads)
	const isGroupMember_promise = group_promise.then((group) => {
		return helper.isGroupMemberAsync(group._id, userId);
	});
	
	// Get posts
	const posts_promise = group_promise.then(function(group) {
		return db.collection('forum_posts').find({ 'threadId': threadId }).toArrayAsync().map(function(post) {
			
			// Check if user has voted for this post
			const postUserVote_promise = helper.hasUserVotedAsync(post._id, userId);
			
			// Count sum of total votes for this post
			const postSumVotes_promise = helper.sumVotesAsync(post._id);
			
			// Add post author name (can be null if not available)
			const postAuthorName_promise = groups.helper.generateMemberName(group._id, post.authorId);
			
			// Get edits of this post
			const postEdits_promise = db.collection('forum_edits').find({ 'entityId': post._id }).toArrayAsync();
			
			// For every post, get comments
			const comments_promise = db.collection('forum_comments').find({ 'postId': post._id }).toArrayAsync().map(function(comment) {
				// Check if user has voted for this comment
				const commentUserVote_promise = helper.hasUserVotedAsync(comment._id, userId);
				
				// Count sum of votes for this post
				const commentSumVotes_promise = helper.sumVotesAsync(comment._id);
				
				// Add comment author name (can be null if not available)
				const commentAuthorName_promise = groups.helper.generateMemberName(group._id, comment.authorId);
				
				// Get edits of this comment
				const commentEdits_promise = db.collection('forum_edits').find({ 'entityId': comment._id }).toArrayAsync();
				
				// Extend comment by user vote and sum of votes
				return Promise.join(commentUserVote_promise, commentSumVotes_promise, commentAuthorName_promise, commentEdits_promise)
					.spread(function(commentUserVote, commentSumVotes, commentAuthorName, commentEdits) {
					
					return _.extend(comment, {
						'userVote': commentUserVote,
						'sumVotes': commentSumVotes,
						'authorName': commentAuthorName,
						'editHistory': commentEdits
					});
				});
					
			});
			
			// Extend post by user vote, sum of votes and comments
			return Promise.join(postUserVote_promise, postSumVotes_promise, postAuthorName_promise, postEdits_promise, comments_promise)
				.spread(function(postUserVote, postSumVotes, postAuthorName, postEdits, comments) {
				
				return _.extend(post, {
					'comments': comments,
					'userVote': postUserVote,
					'sumVotes': postSumVotes,
					'authorName': postAuthorName,
					'editHistory': postEdits
				});
			});
		});
	});
	
	// Increase number of views by one
	const viewsUpdate_promise = db.collection('forum_threads')
		.updateAsync({ '_id': threadId }, { $inc: {'views': 1} });
	
	// Send result
	Promise.join(thread_promise, isGroupMember_promise, posts_promise, viewsUpdate_promise, notifyStatus_promise)
		.spread(function(thread, isGroupMember, posts, viewsUpdate) {
		return {
			'thread': _.extend(thread, {'isGroupMember': isGroupMember}),
			'posts': posts
		};
	}).then(res.json.bind(res));
};

/**
 * @desc: Edit thread of specific forum of specific group
 */
exports.edit = function(req, res) {
	const userId = ObjectId(req.user._id);
	const threadId = ObjectId(req.params.id);
	const updatedThread = req.body.updatedThread;
	const updatedPost = req.body.updatedPost;
	
	// If user is author, store changes, otherwise reject
	helper.isUserOwnerAsync(userId, 'forum_threads', threadId).then(function(isAuthorized) {
		// Update post in database
		const updatePost_promise = db.collection('forum_posts')
		.updateAsync({ '_id': ObjectId(updatedPost.postId) }, { $set: {
			'html': updatedPost.html
		} });
		
		// Update thread in database
		const updateThread_promise = db.collection('forum_threads')
		.updateAsync({ '_id': threadId }, { $set: {
			'title': updatedThread.title,
			'private': updatedThread.private
		} });
		
		// Add edit note
		const editNote_promise = db.collection('forum_edits')
			.insertAsync({ 'entityId': ObjectId(updatedPost.postId), 'authorId': userId });
		
		// Send result to client
		Promise.all([updatePost_promise, updateThread_promise, editNote_promise])
			.then(res.json.bind(res));
	}).catch(utils.isOwnError, utils.handleOwnError(res));
};

/**
 * @desc: Delete thread of specific forum of specific group
 */
exports.delete = function(req, res) {
	const userId = ObjectId(req.user._id);
	const threadId = ObjectId(req.params.id);
	
	// If user is author, delete thread, otherwise reject
	helper.isUserOwnerAsync(userId, 'forum_threads', threadId).then(function(isAuthorized) {
		// Delete thread
		const deleteThread_promise = db.collection('forum_threads').removeByIdAsync(threadId);
		
		// Delete all related posts
		const deletePosts_promise = db.collection('forum_posts').removeAsync({ 'threadId': threadId });
		
		// Delete all related comments
		const deleteComments_promise = db.collection('forum_comments').removeAsync({ 'threadId': threadId });
		
		// Send result to client
		Promise.join(deleteThread_promise, deletePosts_promise, deleteComments_promise)
			.then(res.json.bind(res));
	}).catch(utils.isOwnError, utils.handleOwnError(res));
};

/**
 * @desc: Update solved state of thread (open/closed)
 */
exports.updateSolved = function(req, res) {
	const userId = ObjectId(req.user._id);
	const threadId = ObjectId(req.body.threadId);
	const solved = req.body.solved;
	
	// If user is author, update solved state, otherwise reject
	helper.isUserOwnerAsync(userId, 'forum_threads', threadId).then(function(isAuthorized) {
		// Update solved state
		db.collection('forum_threads')
			.updateAsync({'_id': threadId}, { $set: {'closed': solved} }).then(res.json.bind(res));
		
	}).catch(utils.isOwnError, utils.handleOwnError(res));
};
