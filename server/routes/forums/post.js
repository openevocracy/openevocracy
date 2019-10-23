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
const misc = require('./misc');

/**
 * @desc: Creates new post in forum thread
 */
exports.create = function(req, res) {
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
	helper.isUserAuthorizedToCreateAsync(threadId, authorId).then((isAuthorized) => {
		if(!isAuthorized)
			return utils.rejectPromiseWithMessage(401, 'NOT_AUTHORIZED');
			
		// Store post in database
		const createPost_promise = db.collection('forum_posts').insertAsync(post);
		
		// Reopen thread if it was closed (just open it in any case) and set last activity
		const lastResponse = { 'timestamp': Date.now(), 'userId': authorId };
		const thread_promise = db.collection('forum_threads')
			.updateAsync({ '_id': threadId }, { $set: { 'closed': false, 'lastResponse': lastResponse } });
		
		// Perform a lot of tasks, where group is necessary
		const group_promise = db.collection('groups')
			.findOneAsync({ 'forumId': forumId }).then((group) => {
				
				// Build link to thread
				const urlToThread = cfg.PRIVATE.BASE_URL+'/group/forum/thread/'+threadId;
				
				// Define parameter for email body
				const bodyParams = [ groups.helper.generateMemberName(group._id, authorId), group.name, urlToThread+'#'+postId, urlToThread ];
				
				// Define email translation strings
				const mail = {
					'subject': 'EMAIL_NEW_POST_CREATED_SUBJECT', 'subjectParams': [],
					'body': 'EMAIL_NEW_POST_CREATED_BODY', 'bodyParams': bodyParams
				};
				
				// Finally, send email to watching users, exept the author
				const sendMail_promise = helper.sendMailToWatchingUsersAsync(threadId, authorId, mail);
				
				// Store visited status in database (badge and thread viewed)
				const threadViewed = misc.threadVisited(group._id, threadId, authorId);
				
				return Promise.all([sendMail_promise, threadViewed]);
		});
		
		// Add author to email notification for the related post
		const notifyAddUser_promise = users.getEmailNotifyStatusAsync(authorId, threadId).then(function(status) {
			// only if entry does not already exists (is null), otherwise the user has actively
			// turned off notifications (and should not be bothered) or notifications are already enabled
			return _.isNull(status) ? users.enableEmailNotifyAsync(authorId, threadId) : null;
		});
		
		return Promise.all([createPost_promise, thread_promise, group_promise, notifyAddUser_promise])
			.then(res.json.bind(res));
	
	}).catch(utils.isOwnError, utils.handleOwnError(res));
};

/**
 * @desc: Edits an existing comment for post in forum thread
 */
exports.edit = function(req, res) {
	const userId = ObjectId(req.user._id);
	const postId = ObjectId(req.params.id);
	const updatedPostHtml = req.body.updatedPostHtml;
	
	// If user is author, update post, otherwise reject
	helper.isUserOwnerAsync(userId, 'forum_posts', postId).then(function(isAuthorized) {
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
exports.delete = function(req, res) {
	const userId = ObjectId(req.user._id);
	const postId = ObjectId(req.params.id);
	
	// If user is author, delete post, otherwise reject
	helper.isUserOwnerAsync(userId, 'forum_posts', postId).then(function(isAuthorized) {
		
		// Delete post
		const deletePost_promise = db.collection('forum_posts').removeByIdAsync(postId);
		
		// Delete all related comments
		const deleteComments_promise = db.collection('forum_comments').removeAsync({ 'postId': postId });
		
		// Send result to client
		Promise.join(deletePost_promise, deleteComments_promise).then(res.json.bind(res));
		
	}).catch(utils.isOwnError, utils.handleOwnError(res));
};
