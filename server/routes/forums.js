// General libraries
var _ = require('underscore');
var db = require('../database').db;
var ObjectId = require('mongodb').ObjectID;
var Promise = require('bluebird');

/*
 * @desc: Query orum of specific group
 */
exports.queryForum = function(req, res) {
	var forumId = ObjectId(req.params.id);
	//var userId = ObjectId(req.user._id);
	
	// Get group and topic
	var group_promise = db.collection('groups').findOneAsync({'forumId': forumId}, {'topicId': true});
	var pad_promise = group_promise.then(function(group) {
		return db.collection('pads_group').findOneAsync({'groupId': group._id}, {'_id': true});
	});
	var topic_promise = group_promise.then(function(group) {
		return db.collection('topics').findOneAsync({'_id': group.topicId}, {'name': true});
	});
	
	// Send group id and topic name
	Promise.join(group_promise, pad_promise, topic_promise).spread(function(group, pad, topic) {
		return { 'groupId': group._id, 'padId': pad._id, 'title': topic.name };
	}).then(res.json.bind(res));
	
};

/*
 * @desc: Creates new thread in forum of specific group
 */
exports.createThread = function(req, res) {
	var userId = ObjectId(req.user._id);
	var thread = req.body;
	
	// Add author to thread
	_.extend(thread, {'authorId': userId});
	
	// Store thread in database
	db.collection('forum_threads').insertAsync(thread)
		.then(res.json.bind(res));
};
