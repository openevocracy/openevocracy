// General libraries
var _ = require('underscore');
var db = require('../database').db;
var ObjectId = require('mongodb').ObjectID;
var Promise = require('bluebird');

// Import routes
var utils = require('../utils');
var groups = require('./groups');

function commentTextareaToHtml(str) {
	// First strip html, then add <p> and replace \n by <br/>
	return '<p>'+utils.stripHtml(str).replace(/\n/g, '<br/>')+'</p>';
}

/**
 * @desc: Check if user is authorized to edit or delete a specific entity
 *        An entity can be: thread, post or comment
 */
function isUserAuthorizedAsync(userId, collection, entityId) {
	return db.collection(collection).findOneAsync({ '_id': entityId }, { 'authorId': true	})
		.then(function(thread) {
			// If user is not author, reject promise
			if (!utils.equalId(userId, thread.authorId))
				return utils.rejectPromiseWithMessage(401, 'NOT_AUTHORIZED');
			return true;
	});
}

/*
 * @desc: Query forum of specific group
 */
exports.queryForum = function(req, res) {
	var forumId = ObjectId(req.params.id);
	//var userId = ObjectId(req.user._id);
	
	// Get group
	var group_promise = db.collection('groups').findOneAsync({'forumId': forumId}, {'topicId': true});
	
	// Get group pad
	var pad_promise = group_promise.then(function(group) {
		return db.collection('pads_group').findOneAsync({'groupId': group._id}, {'_id': true});
	});
	
	// Get topic
	var topic_promise = group_promise.then(function(group) {
		return db.collection('topics').findOneAsync({'_id': group.topicId}, {'name': true});
	});
	
	// Get threads
	var threads_promise = group_promise.then(function(group) {
		return db.collection('forum_threads').find({'forumId': forumId}).toArrayAsync().map(function(thread) {
			// Get sum of votes of mainpost
			const sumMainpostVotes_promise = sumVotesAsync(thread.mainPostId);
			
			// Get number of posts
			const numPosts_promise = db.collection('forum_posts').countAsync({ 'threadId': thread._id });
			
			// Add author name (can be null if not available)
			const authorName_promise = groups.generateUserName(group._id, thread.authorId);
			
			// Add sum of votes of mainpost and number of posts to every thread
			return Promise.join(sumMainpostVotes_promise, numPosts_promise, authorName_promise)
				.spread(function(sumMainpostVotes, numPosts, authorName) {
					// Reduce numPosts by 1 since the main post shall not be counted
					return _.extend(thread, {'sumMainpostVotes': sumMainpostVotes, 'postCount': (numPosts-1), 'authorName': authorName});
			});
		});
	});
	
	// Send group id and topic name
	Promise.join(group_promise, pad_promise, topic_promise, threads_promise).spread(function(group, pad, topic, threads) {
		return {
			'groupId': group._id,
			'padId': pad._id,
			'title': topic.name,
			'threads': threads
		};
	}).then(res.json.bind(res));
	
};

/*
 * @desc: Creates new thread in forum of specific group
 */
exports.createThread = function(req, res) {
	const userId = ObjectId(req.user._id);
	const body = req.body;
	
	// Generate threadId and mainPostId
	const threadId = ObjectId();
	const mainPostId = ObjectId();
	
	// Define thread
	const thread = {
		'_id': threadId,
		'mainPostId': mainPostId,
		'forumId': ObjectId(body.forumId),
		'authorId': userId,
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
		'forumId': ObjectId(body.forumId),
		'authorId': userId,
		'html': body.html
	};
	
	// Store main post in database
	const post_promise = db.collection('forum_posts').insertAsync(post);
	
	// Wait for both promises and send response
	Promise.join(thread_promise, post_promise).spread(function(thread, post) {
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
	
	// Get thread
	const thread_promise = db.collection('forum_threads').findOneAsync({'_id': threadId});
	
	// Get group
	var group_promise = thread_promise.then(function(thread) {
		return db.collection('groups').findOneAsync({'forumId': thread.forumId}, {});
	});
	
	// Get posts
	const posts_promise = group_promise.then(function(group) {
		return db.collection('forum_posts').find({ 'threadId': threadId }).toArrayAsync().map(function(post) {
			
			// Check if user has voted for this post
			const postUserVote_promise = hasUserVotedAsync(post._id, userId);
			
			// Count sum of votes for this post
			const postSumVotes_promise = sumVotesAsync(post._id);
			
			// Add post author name (can be null if not available)
			const postAuthorName_promise = groups.generateUserName(group._id, post.authorId);
			
			// For every post, get comments
			const comments_promise = db.collection('forum_comments').find({ 'postId': post._id }).toArrayAsync().map(function(comment) {
				// Check if user has voted for this comment
				const commentUserVote_promise = hasUserVotedAsync(comment._id, userId);
				
				// Count sum of votes for this post
				const commentSumVotes_promise = sumVotesAsync(comment._id);
				
				// Add comment author name (can be null if not available)
				const commentAuthorName_promise = groups.generateUserName(group._id, comment.authorId);
				
				// Extend comment by user vote and sum of votes
				return Promise.join(commentUserVote_promise, commentSumVotes_promise, commentAuthorName_promise)
					.spread(function(commentUserVote, commentSumVotes, commentAuthorName) {
					
					return _.extend(comment, { 'userVote': commentUserVote, 'sumVotes': commentSumVotes, 'authorName': commentAuthorName });
				});
					
			});
			
			// Extend post by user vote, sum of votes and comments
			return Promise.join(postUserVote_promise, postSumVotes_promise, postAuthorName_promise, comments_promise)
				.spread(function(postUserVote, postSumVotes, postAuthorName, comments) {
				
				return _.extend(post, { 'comments': comments, 'userVote': postUserVote, 'sumVotes': postSumVotes, 'authorName': postAuthorName });
			});
		});
	});
	
	// Increase number of views by one
	const viewsUpdate_promise = db.collection('forum_threads')
		.updateAsync({ '_id': threadId }, { $inc: {'views': 1} });
	
	// Send result
	Promise.join(thread_promise, posts_promise, viewsUpdate_promise)
		.spread(function(thread, posts, viewsUpdate) {
		return {
			'thread': thread,
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
	isUserAuthorizedAsync(userId, 'forum_threads', threadId).then(function(isAuthorized) {
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
		
		// Send result to client
		Promise.join(updatePost_promise, updateThread_promise)
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
	isUserAuthorizedAsync(userId, 'forum_threads', threadId).then(function(isAuthorized) {
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
	const userId = ObjectId(req.user._id);
	const body = req.body;
	
	// Define post
	const post = {
		'html': body.html,
		'threadId': ObjectId(body.threadId),
		'forumId': ObjectId(body.forumId),
		'authorId': userId
	};
	
	// Store post in database
	const createPost_promise = db.collection('forum_posts').insertAsync(post);
	
	// Reopen thread if it was closed (just open it in any case)
	const openThread_promise = db.collection('forum_threads')
		.updateAsync({ '_id': post.threadId }, { $set: { 'closed': false } });
	
	Promise.all([createPost_promise, openThread_promise]).then(res.json.bind(res));
};

/**
 * @desc: Edits an existing comment for post in forum thread
 */
exports.editPost = function(req, res) {
	const userId = ObjectId(req.user._id);
	const postId = ObjectId(req.params.id);
	const updatedPostHtml = req.body.updatedPostHtml;
	
	// If user is author, update post, otherwise reject
	isUserAuthorizedAsync(userId, 'forum_posts', postId).then(function(isAuthorized) {
		// Update post in database
		db.collection('forum_posts')
			.updateAsync({ '_id': postId }, { $set: { 'html': updatedPostHtml } })
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
	isUserAuthorizedAsync(userId, 'forum_posts', postId).then(function(isAuthorized) {
		
		// Delete post
		const deletePost_promise = db.collection('forum_posts').removeByIdAsync(postId);
		
		// Delete all related comments
		const deleteComments_promise = db.collection('forum_comments').removeAsync({ 'postId': postId });
		
		// Send result to client
		Promise.join(deletePost_promise, deleteComments_promise)
			.then(res.json.bind(res));
		
	}).catch(utils.isOwnError, utils.handleOwnError(res));
};

/**
 * @desc: Creates new comment for post in forum thread
 */
exports.createComment = function(req, res) {
	const userId = ObjectId(req.user._id);
	const body = req.body;
	
	// Define post
	const comment = {
		'html': commentTextareaToHtml(body.text),
		'postId': ObjectId(body.postId),
		'threadId': ObjectId(body.threadId),
		'forumId': ObjectId(body.forumId),
		'authorId': userId
	};
	
	// Store comment in database
	db.collection('forum_comments').insertAsync(comment)
		.then(res.json.bind(res));
};

/**
 * @desc: Edits an existing comment for post in forum thread
 */
exports.editComment = function(req, res) {
	const userId = ObjectId(req.user._id);
	const commentId = ObjectId(req.params.id);
	const updatedCommentHtml = req.body.updatedCommentHtml;
	
	// If user is author, update comment, otherwise reject
	isUserAuthorizedAsync(userId, 'forum_comments', commentId).then(function(isAuthorized) {
		// Update comment in database
		db.collection('forum_comments')
			.updateAsync({ '_id': commentId }, { $set: { 'html': commentTextareaToHtml(updatedCommentHtml) } })
			.then(res.json.bind(res));
	}).catch(utils.isOwnError, utils.handleOwnError(res));
};

/**
 * @desc: Deletes a comment in a thread
 */
exports.deleteComment = function(req, res) {
	const userId = ObjectId(req.user._id);
	const commentId = ObjectId(req.params.id);
	
	// If user is author, update comment, otherwise reject
	isUserAuthorizedAsync(userId, 'forum_comments', commentId).then(function(isAuthorized) {
		// Delete comment in database
		db.collection('forum_comments').removeByIdAsync(commentId)
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
	isUserAuthorizedAsync(userId, 'forum_threads', threadId).then(function(isAuthorized) {
		// Update solved state
		db.collection('forum_threads').updateAsync({'_id': threadId}, { $set: {'closed': solved} })
			.then(res.json.bind(res));
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
