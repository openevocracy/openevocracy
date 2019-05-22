// General libraries
var _ = require('underscore');
var db = require('../database').db;
var ObjectId = require('mongodb').ObjectID;
var Promise = require('bluebird');

// Import routes
var utils = require('../utils');

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
	
	// Get group, group pad and topic
	var group_promise = db.collection('groups').findOneAsync({'forumId': forumId}, {'topicId': true});
	var pad_promise = group_promise.then(function(group) {
		return db.collection('pads_group').findOneAsync({'groupId': group._id}, {'_id': true});
	});
	var topic_promise = group_promise.then(function(group) {
		return db.collection('topics').findOneAsync({'_id': group.topicId}, {'name': true});
	});
	
	// Get threads
	var threads_promise = db.collection('forum_threads')
		.find({'forumId': forumId}).toArrayAsync().map(function(thread) {
			// Add number of posts to every thread
			return db.collection('forum_posts').countAsync({ 'threadId': thread._id }).then(function(postCount) {
				// Reduce postCount by 1 since the main post shall not be counted
				return _.extend(thread, {'postCount': (postCount-1)});
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
 * @desc: Query thread of specific forum of specific group
 */
exports.queryThread = function(req, res) {
	const threadId = ObjectId(req.params.id);
	
	// Get thread
	const thread_promise = db.collection('forum_threads').findOneAsync({'_id': threadId});
	
	// Get posts
	const posts_promise = db.collection('forum_posts').find({'threadId': threadId}).toArrayAsync().map(function(post) {
		
		// FIXME: Is a Promise.resolve() necessary before return? Or does map() aldready handle it correctly?
		
		// For every post, get comments
		return db.collection('forum_comments').find({'postId': post._id}).toArrayAsync().then(function(comments) {
				// Add comments to post as array
				return _.extend(post, {'comments': comments});
		});
	});
	
	// Increase number of views by one
	const viewsUpdate_promise = db.collection('forum_threads')
		.updateAsync({ '_id': threadId }, {$inc: {'views': 1} });
	
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
	db.collection('forum_posts').insertAsync(post)
		.then(res.json.bind(res));
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
