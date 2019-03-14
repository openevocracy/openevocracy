// General libraries
var _ = require('underscore');
var db = require('../database').db;
var ObjectId = require('mongodb').ObjectID;
var Promise = require('bluebird');

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
	var userId = ObjectId(req.user._id);
	var body = req.body;
	
	// Define thread
	var thread = {
		'title': body.title,
		'html': body.html,
		'private': body.private,
		'forumId': ObjectId(body.forumId),
		'closed': false,
		'citationId': null,
		'authorId': userId
	};
	
	// Store thread in database
	db.collection('forum_threads').insertAsync(thread)
		.then(res.json.bind(res));
};

/**
 * @desc: Query thread of specific forum of specific group
 */
exports.queryThread = function(req, res) {
	const threadId = ObjectId(req.params.id);
	
	// Get threads
	var thread_promise = db.collection('forum_threads').findOneAsync({'_id': threadId});
	
	// Send result
	thread_promise.then(res.json.bind(res));
};
