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
	var threads_promise = db.collection('forum_threads').find({'forumId': forumId}).toArrayAsync();
	
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
		'citationId': null
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
	
	// Send result
	Promise.join(thread_promise, posts_promise).spread(function(thread, posts) {
		return {
			'thread': thread,
			'posts': posts
		};
	}).then(res.json.bind(res));
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
 * @desc: Deletes a post in a thread
 */
exports.deletePost = function(req, res) {
	const postId = ObjectId(req.params.id);
	
	// Delete post
	const delete_post_promise = db.collection('forum_posts').removeByIdAsync(postId);
	
	// Delete all related comments
	const delete_comments_promise = db.collection('forum_comments').removeAsync({ 'postId': postId });
	
	// Send result to client
	Promise.join(delete_post_promise, delete_comments_promise)
		.then(res.json.bind(res));
};

/**
 * @desc: Deletes a comment in a thread
 */
exports.deleteComment = function(req, res) {
	const commentId = ObjectId(req.params.id);
	
	// Delete comment in database
	db.collection('forum_comments').removeByIdAsync(commentId)
		.then(res.json.bind(res));
};

/**
 * @desc: Edits an existing comment for post in forum thread
 */
exports.editComment = function(req, res) {
	const commentId = ObjectId(req.params.id);
	const updatedComment = req.body.updatedComment;
	
	// Update comment in database
	db.collection('forum_comments')
		.updateAsync({ '_id': commentId }, { $set: { 'html': commentTextareaToHtml(updatedComment) } })
		.then(res.json.bind(res));
};

/**
 * @desc: Edits an existing comment for post in forum thread
 */
exports.editPost = function(req, res) {
	const postId = ObjectId(req.params.id);
	const updatedPost = req.body.updatedPost;
	
	// Update comment in database
	db.collection('forum_posts')
		.updateAsync({ '_id': postId }, { $set: { 'html': updatedPost } })
		.then(res.json.bind(res));
};
