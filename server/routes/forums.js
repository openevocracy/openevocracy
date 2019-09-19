// General libraries
const _ = require('underscore');
const db = require('../database').db;
const ObjectId = require('mongodb').ObjectID;
const Promise = require('bluebird');

// Import routes
var cfg = require('../../shared/config').cfg;
const mail = require('../mail');
const utils = require('../utils');
const groups = require('./groups');
const users = require('./users');

function commentTextareaToHtml(str) {
	// First strip html, then add <p> and replace \n by <br/>
	return '<p>'+utils.stripHtml(str).replace(/\n/g, '<br/>')+'</p>';
}

/**
 * @desc: Check if user is authorized to edit or delete a specific entity
 *        An entity can be: thread, post or comment
 */
function isUserOwnerAsync(userId, collection, entityId) {
	return db.collection(collection).findOneAsync({ '_id': entityId }, { 'authorId': true	})
		.then(function(entity) {
			// If user is not author, reject promise
			if (!utils.equalId(userId, entity.authorId))
				return utils.rejectPromiseWithMessage(401, 'NOT_AUTHORIZED');
			return true;
	});
}

/**
 * @desc: Send email to all users watching the entity (e.g. forum or thread), exept the author
 * @params:
 *    entityId: id of entity users are watching (e.g. forum or thread)
 *    authorId: id of author of the entity
 *    mail: contains subject, subjectParams, body, bodyParams
 **/
function sendMailToWatchingUsersAsync(entityId, authorId, content) {
	return users.getNotifyUserIdsForEntity(entityId).then(function(userIds) {
		// Remove author from list of userIds
		const userIdsWithoutAuthor = utils.withoutObjectId(userIds, authorId);
		
		// Send mail to all users
		mail.sendMailToUserIds(userIdsWithoutAuthor, content.subject, content.subjectParams, content.body, content.bodyParams);
	});
}

/**
 * @desc: Check if current user is member of a group
 * @return: boolean flag, indicating if user is part of group or not
 */
function isGroupMemberAsync(groupId, userId) {
	return db.collection('group_relations')
		.find({ 'groupId': groupId }).toArrayAsync().then((relations) => {
		
		// Get members uderIds from relation
		const members = _.pluck(relations, 'userId');
		// Check if current user is part of members, returns true or false
		return utils.containsObjectId(members, userId);
	});
}

/**
 * @desc: Checks if user is allowed to create a post or comment
 * 		 First, checks if thread is private
 * 		 If so, check if user is member of group
 * @return: boolean flag, indicating if user is 
 */
function isUserAuthorizedToCreateAsync(threadId, userId) {
	return db.collection('forum_threads')
		.findOneAsync({ '_id': threadId }).then((thread) => {
		
		// If thread is public, directly return true
		if(!thread.private)
			return true;
		
		// If thread is private, check if user is member of group
		return db.collection('groups')
			.findOneAsync({ 'forumId': thread.forumId }, { '_id': true }).then((group) => {
				return isGroupMemberAsync(group._id, userId);
		});
	});
}

/*
 * @desc: Query forum of specific group
 */
exports.queryForum = function(req, res) {
	var groupId = ObjectId(req.params.id);
	var userId = ObjectId(req.user._id);
	
	// Get group
	var group_promise = db.collection('groups').findOneAsync({'_id': groupId});
	
	// Get email notification status of user for this forum
	const notifyStatus_promise = group_promise.then((group) => {
		return users.getEmailNotifyStatusAsync(userId, group.forumId);
	});
	
	// Get threads
	var threads_promise = group_promise.then(function(group) {
		return db.collection('forum_threads').find({'forumId': group.forumId}).toArrayAsync().map(function(thread) {
			// Get sum of votes of mainpost
			const sumMainpostVotes_promise = sumVotesAsync(thread.mainPostId);
			
			// Get number of posts
			const numPosts_promise = db.collection('forum_posts').countAsync({ 'threadId': thread._id });
			
			// Add author name (can be null if not available)
			const authorName = groups.generateMemberName(group._id, thread.authorId);
			
			// Add user name to last activity, if last activity exists
			if(thread.lastResponse)
				thread.lastResponse.userName = groups.generateMemberName(group._id, thread.lastResponse.userId);
			
			// Add sum of votes of mainpost and number of posts to every thread
			return Promise.join(sumMainpostVotes_promise, numPosts_promise)
				.spread(function(sumMainpostVotes, numPosts) {
					// Reduce numPosts by 1 since the main post shall not be counted
					return _.extend(thread, {
						'sumMainpostVotes': sumMainpostVotes,
						'postCount': (numPosts-1),
						'authorName': authorName
					});
			});
		});
	});
	
	// Send group id and topic name
	Promise.join(group_promise, notifyStatus_promise, threads_promise)
		.spread(function(group, notifyStatus, threads) {
		return {
			'forumId': group.forumId,
			'notifyStatus': notifyStatus,
			'threads': threads
		};
	}).then(res.json.bind(res));
	
};

/*
 * @desc: Creates new thread in forum of specific group
 */
exports.createThread = function(req, res) {
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
			const bodyParams = [ groups.generateMemberName(group._id, authorId), group.name, urlToThread, urlToForum ];
			
			// Define email translation strings
			const mail = {
				'subject': 'EMAIL_NEW_THREAD_CREATED_SUBJECT', 'subjectParams': [],
				'body': 'EMAIL_NEW_THREAD_CREATED_BODY', 'bodyParams': bodyParams
			};
			
			// Finally, send email to watching users
			return sendMailToWatchingUsersAsync(forumId, authorId, mail);
	});
	
	
	// Add author to email notification for this thread
	const notifyAddAuthor_promise = users.enableEmailNotifyAsync(authorId, threadId);
	
	// Wait for promises and send response
	Promise.join(thread_promise, post_promise, notifyUsers_promise, notifyAddAuthor_promise).spread(function(thread, post) {
		return { 'thread': thread, 'post': post };
	}).then(res.json.bind(res));
};

/**
 * @desc: Check if a user has voted for a specific entity (post or comment)
 */
function hasUserVotedAsync(entityId, userId) {
	return db.collection('forum_votes').findOneAsync({ 'entityId': entityId, 'userId': userId }).then(function(userVote) {
		// If userVote is null, user has not voted, retun null again, otherwise return vote value (-1, 1)
		return _.isNull(userVote) ? null : userVote.voteValue;
	});
}

/**
 * @desc: Count sum of votes for a specific entity (post or comment)
 */
function sumVotesAsync(entityId) {
	return db.collection('forum_votes')
		.aggregateAsync([
			{ $match: { 'entityId': entityId } },
			{ $group: { _id: null, 'sumVotes': { $sum: "$voteValue" } } }
		])
		.then(function(group) {
			// If somehting was found, return the sum of votes, otherwise 0
			return group.length > 0 ? group[0].sumVotes : 0;
		});
}

/**
 * @desc: Query thread of specific forum of specific group
 */
exports.queryThread = function(req, res) {
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
		return isGroupMemberAsync(group._id, userId);
	});
	
	// Get posts
	const posts_promise = group_promise.then(function(group) {
		return db.collection('forum_posts').find({ 'threadId': threadId }).toArrayAsync().map(function(post) {
			
			// Check if user has voted for this post
			const postUserVote_promise = hasUserVotedAsync(post._id, userId);
			
			// Count sum of total votes for this post
			const postSumVotes_promise = sumVotesAsync(post._id);
			
			// Add post author name (can be null if not available)
			const postAuthorName_promise = groups.generateMemberName(group._id, post.authorId);
			
			// Get edits of this post
			const postEdits_promise = db.collection('forum_edits').find({ 'entityId': post._id }).toArrayAsync();
			
			// For every post, get comments
			const comments_promise = db.collection('forum_comments').find({ 'postId': post._id }).toArrayAsync().map(function(comment) {
				// Check if user has voted for this comment
				const commentUserVote_promise = hasUserVotedAsync(comment._id, userId);
				
				// Count sum of votes for this post
				const commentSumVotes_promise = sumVotesAsync(comment._id);
				
				// Add comment author name (can be null if not available)
				const commentAuthorName_promise = groups.generateMemberName(group._id, comment.authorId);
				
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
exports.editThread = function(req, res) {
	const userId = ObjectId(req.user._id);
	const threadId = ObjectId(req.params.id);
	const updatedThread = req.body.updatedThread;
	const updatedPost = req.body.updatedPost;
	
	// If user is author, store changes, otherwise reject
	isUserOwnerAsync(userId, 'forum_threads', threadId).then(function(isAuthorized) {
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
exports.deleteThread = function(req, res) {
	const userId = ObjectId(req.user._id);
	const threadId = ObjectId(req.params.id);
	
	// If user is author, delete thread, otherwise reject
	isUserOwnerAsync(userId, 'forum_threads', threadId).then(function(isAuthorized) {
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
 * @desc: Creates new post in forum thread
 */
exports.createPost = function(req, res) {
	const authorId = ObjectId(req.user._id);
	const body = req.body;
	const threadId = ObjectId(body.threadId);
	const forumId = ObjectId(body.forumId);
	
	// Define post
	const postId = ObjectId();
	const post = {
		'_id': postId,
		'html': body.html,
		'threadId': threadId,
		'forumId': forumId,
		'authorId': authorId
	};
	
	// Check if user is allowed to create a post
	isUserAuthorizedToCreateAsync(threadId, authorId).then((isAuthorized) => {
		if(!isAuthorized)
			return utils.rejectPromiseWithMessage(401, 'NOT_AUTHORIZED');
			
		// Store post in database
		const createPost_promise = db.collection('forum_posts').insertAsync(post);
		
		// Reopen thread if it was closed (just open it in any case) and set last activity
		const lastResponse = { 'timestamp': Date.now(), 'userId': authorId };
		const thread_promise = db.collection('forum_threads')
			.updateAsync({ '_id': threadId }, { $set: { 'closed': false, 'lastResponse': lastResponse } });
		
		// Send email to all users who are watching the thread, exept the author
		const notifyUsers_promise = db.collection('groups')
			.findOneAsync({ 'forumId': forumId }, { 'name': true }).then((group) => {
				
				// Build link to thread
				const urlToThread = cfg.PRIVATE.BASE_URL+'/group/forum/thread/'+threadId;
				
				// Define parameter for email body
				const bodyParams = [ groups.generateMemberName(group._id, authorId), group.name, urlToThread+'#'+postId, urlToThread ];
				
				// Define email translation strings
				const mail = {
					'subject': 'EMAIL_NEW_POST_CREATED_SUBJECT', 'subjectParams': [],
					'body': 'EMAIL_NEW_POST_CREATED_BODY', 'bodyParams': bodyParams
				};
				
				// Finally, send email to watching users
				return sendMailToWatchingUsersAsync(threadId, authorId, mail);
		});
			
		// Add author to email notification for the related post
		const notifyAddUser_promise = users.getEmailNotifyStatusAsync(authorId, threadId).then(function(status) {
			// only if entry does not already exists (is null), otherwise the user has actively
			// turned off notifications (and should not be bothered) or notifications are already enabled
			return _.isNull(status) ? users.enableEmailNotifyAsync(authorId, threadId) : null;
		});
		
		Promise.all([createPost_promise, thread_promise, notifyUsers_promise, notifyAddUser_promise])
			.then(res.json.bind(res));
		
	}).catch(utils.isOwnError, utils.handleOwnError(res));
};

/**
 * @desc: Edits an existing comment for post in forum thread
 */
exports.editPost = function(req, res) {
	const userId = ObjectId(req.user._id);
	const postId = ObjectId(req.params.id);
	const updatedPostHtml = req.body.updatedPostHtml;
	
	// If user is author, update post, otherwise reject
	isUserOwnerAsync(userId, 'forum_posts', postId).then(function(isAuthorized) {
		// Update post in database
		const updatePost_promise = db.collection('forum_posts')
			.updateAsync({ '_id': postId }, { $set: { 'html': updatedPostHtml } });
		
		// Add edit note
		const editNote_promise = db.collection('forum_edits')
			.insertAsync({ 'entityId': postId, 'authorId': userId });
		
		Promise.all([ updatePost_promise, editNote_promise ])
			.then(res.json.bind(res));
	}).catch(utils.isOwnError, utils.handleOwnError(res));
};

/**
 * @desc: Deletes a post in a thread
 */
exports.deletePost = function(req, res) {
	const userId = ObjectId(req.user._id);
	const postId = ObjectId(req.params.id);
	
	// If user is author, delete post, otherwise reject
	isUserOwnerAsync(userId, 'forum_posts', postId).then(function(isAuthorized) {
		
		// Delete post
		const deletePost_promise = db.collection('forum_posts').removeByIdAsync(postId);
		
		// Delete all related comments
		const deleteComments_promise = db.collection('forum_comments').removeAsync({ 'postId': postId });
		
		// Send result to client
		Promise.join(deletePost_promise, deleteComments_promise).then(res.json.bind(res));
		
	}).catch(utils.isOwnError, utils.handleOwnError(res));
};

/**
 * @desc: Creates new comment for post in forum thread
 */
exports.createComment = function(req, res) {
	const authorId = ObjectId(req.user._id);
	const body = req.body;
	
	// Define comment
	const comment = {
		'html': commentTextareaToHtml(body.text),
		'postId': ObjectId(body.postId),
		'threadId': ObjectId(body.threadId),
		'forumId': ObjectId(body.forumId),
		'authorId': authorId
	};
	
	// Check if user is allowed to create a post
	isUserAuthorizedToCreateAsync(comment.threadId, authorId).then((isAuthorized) => {
		if(!isAuthorized)
			return utils.rejectPromiseWithMessage(401, 'NOT_AUTHORIZED');
	
		// Store comment in database
		const createComment_promise = db.collection('forum_comments').insertAsync(comment);
		
		// Set last activity
		const lastResponse = { 'timestamp': Date.now(), 'userId': authorId };
		const thread_promise = db.collection('forum_threads')
			.updateAsync({ '_id': comment.threadId }, { $set: { 'lastResponse': lastResponse } });
		
		Promise.all([createComment_promise, thread_promise]).then(res.json.bind(res));
		
	}).catch(utils.isOwnError, utils.handleOwnError(res));
};

/**
 * @desc: Edits an existing comment for post in forum thread
 */
exports.editComment = function(req, res) {
	const userId = ObjectId(req.user._id);
	const commentId = ObjectId(req.params.id);
	const updatedCommentHtml = req.body.updatedCommentHtml;
	
	// If user is author, update comment, otherwise reject
	isUserOwnerAsync(userId, 'forum_comments', commentId).then(function(isAuthorized) {
		// Update comment in database
		const commentUpdate_promise = db.collection('forum_comments')
			.updateAsync({ '_id': commentId }, { $set: { 'html': commentTextareaToHtml(updatedCommentHtml) } });
			
		// Add edit note
		const editNote_promise = db.collection('forum_edits')
			.insertAsync({ 'entityId': commentId, 'authorId': userId });
		
		Promise.all([ commentUpdate_promise, editNote_promise ]).then(res.json.bind(res));
		
	}).catch(utils.isOwnError, utils.handleOwnError(res));
};

/**
 * @desc: Deletes a comment in a thread
 */
exports.deleteComment = function(req, res) {
	const userId = ObjectId(req.user._id);
	const commentId = ObjectId(req.params.id);
	
	// If user is author, update comment, otherwise reject
	isUserOwnerAsync(userId, 'forum_comments', commentId).then(function(isAuthorized) {
		// Delete comment in database
		db.collection('forum_comments').removeByIdAsync(commentId).then(res.json.bind(res));
		
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
	isUserOwnerAsync(userId, 'forum_threads', threadId).then(function(isAuthorized) {
		// Update solved state
		db.collection('forum_threads')
			.updateAsync({'_id': threadId}, { $set: {'closed': solved} }).then(res.json.bind(res));
		
	}).catch(utils.isOwnError, utils.handleOwnError(res));
};

/**
 * @desc: Vote for entity (post or comment)
 */
exports.vote = function(req, res) {
	const userId = ObjectId(req.user._id);
	const entityId = ObjectId(req.body.entityId);
	const voteValue = req.body.voteValue;
	
	// Check if vote value is -1, 0 or 1
	if (voteValue != -1 && voteValue != 0 && voteValue != 1) {
		utils.sendMessage(400, 'VOTE_VALUE_ERROR');
		return;
	}
	
	// Define search pattern for database request (user voted for entity)
	const userEntityRelation = {
		'userId': userId,
		'entityId': entityId
	};
	
	// If vote value is 0, remove entity row from databse, otherwise update value
	if (voteValue == 0) {
		// Remove vote value
		db.collection('forum_votes').removeAsync(userEntityRelation).then(res.json.bind(res));
	} else {
		// Update vote value
		db.collection('forum_votes')
			.updateAsync(userEntityRelation, { $set: {'voteValue': voteValue} }, { 'upsert': true })
			.then(res.json.bind(res));
	}
};
