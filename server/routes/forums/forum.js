// General libraries
const _ = require('underscore');
const ObjectId = require('mongodb').ObjectID;
const Promise = require('bluebird');

// Import routes
const db = require('../../database').db;
const groups = require('../groups');
const users = require('../users');
const helper = require('./helper');

/*
 * @desc: Query forum of specific group
 */
exports.query = function(req, res) {
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
			const sumMainpostVotes_promise = helper.sumVotesAsync(thread.mainPostId);
			
			// Get number of posts
			const numPosts_promise = db.collection('forum_posts').countAsync({ 'threadId': thread._id });
			
			// Add author name (can be null if not available)
			const authorName_promise = groups.helper.getGroupUserNameAsync(group._id, thread.authorId);
			
			// Add user name to last activity, if last activity exists
			const lastActivityUserName_promise = Promise.resolve().then(() => {
				if (thread.lastResponse)
					return groups.helper.getGroupUserNameAsync(group._id, thread.lastResponse.userId);
				else
					return null;
			});
			
			// Get viewed status for all threads in current forum
			const viewedStatus_promise = db.collection('forum_threads_viewed')
				.findOneAsync({ 'userId': userId, 'viewed': thread._id }).then((value) => {
					// Return true if value was found, false if not
					return !_.isNull(value);
			});
			
			// Add sum of votes of mainpost and number of posts to every thread
			return Promise.join(sumMainpostVotes_promise, numPosts_promise, viewedStatus_promise, authorName_promise, lastActivityUserName_promise)
				.spread(function(sumMainpostVotes, numPosts, viewedStatus, authorName, lastActivityUserName) {
					// Add last activity user name if given
					if (lastActivityUserName !== null)
						thread.lastResponse.userName = lastActivityUserName;
					
					// Reduce numPosts by 1 since the main post shall not be counted
					return _.extend(thread, {
						'sumMainpostVotes': sumMainpostVotes,
						'postCount': (numPosts-1),
						'authorName': authorName,
						'wasViewed': viewedStatus
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
