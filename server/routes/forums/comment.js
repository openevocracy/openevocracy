// General libraries
const ObjectId = require('mongodb').ObjectID;
const Promise = require('bluebird');

// Import routes
const db = require('../../database').db;
const utils = require('../../utils');
const helper = require('./helper');

/**
 * @desc: Creates new comment for post in forum thread
 */
exports.create = function(req, res) {
	const authorId = ObjectId(req.user._id);
	const body = req.body;
	
	// Define comment
	const comment = {
		'html': helper.commentTextareaToHtml(body.text),
		'postId': ObjectId(body.postId),
		'threadId': ObjectId(body.threadId),
		'forumId': ObjectId(body.forumId),
		'authorId': authorId
	};
	
	// Check if user is allowed to create a post
	helper.isUserAuthorizedToCreateAsync(comment.threadId, authorId).then((isAuthorized) => {
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
exports.edit = function(req, res) {
	const userId = ObjectId(req.user._id);
	const commentId = ObjectId(req.params.id);
	const updatedCommentHtml = req.body.updatedCommentHtml;
	
	// If user is author, update comment, otherwise reject
	helper.isUserOwnerAsync(userId, 'forum_comments', commentId).then(function(isAuthorized) {
		// Update comment in database
		const commentUpdate_promise = db.collection('forum_comments')
			.updateAsync({ '_id': commentId }, { $set: { 'html': helper.commentTextareaToHtml(updatedCommentHtml) } });
			
		// Add edit note
		const editNote_promise = db.collection('forum_edits')
			.insertAsync({ 'entityId': commentId, 'authorId': userId });
		
		Promise.all([ commentUpdate_promise, editNote_promise ]).then(res.json.bind(res));
		
	}).catch(utils.isOwnError, utils.handleOwnError(res));
};

/**
 * @desc: Deletes a comment in a thread
 */
exports.delete = function(req, res) {
	const userId = ObjectId(req.user._id);
	const commentId = ObjectId(req.params.id);
	
	// If user is author, update comment, otherwise reject
	helper.isUserOwnerAsync(userId, 'forum_comments', commentId).then(function(isAuthorized) {
		// Delete comment in database
		db.collection('forum_comments').removeByIdAsync(commentId).then(res.json.bind(res));
		
	}).catch(utils.isOwnError, utils.handleOwnError(res));
};
