// General libraries
const _ = require('underscore');
const ObjectId = require('mongodb').ObjectID;

// Import routes
const db = require('../../database').db;
const mail = require('../../mail');
const utils = require('../../utils');
const users = require('../users');

/**
 * @desc: Transforms content from comment (text with ''\n') to HTML
 */
exports.commentTextareaToHtml = function(str) {
	// First strip html, then add <p> and replace \n by <br/>
	return '<p>'+utils.stripHtml(str).replace(/\n/g, '<br/>')+'</p>';
};

/**
 * @desc: Check if group is expired (given a forumId)
 *        An entity can be: thread, post or comment
 */
exports.isForumExpiredAsync = function(forumId) {
	return db.collection('groups').findOneAsync({ 'forumId': forumId }, { '_id': true })
		.then((group) => { return isGroupExpiredAsync(group._id); });
};

/**
 * @desc: Check if group is expired (given a groupId)
 *        An entity can be: thread, post or comment
 */
function isGroupExpiredAsync(groupId) {
	return db.collection('pads_group').findOneAsync({ 'groupId': groupId }, { 'expiration': true })
		.then(function(pad) {
			// Get expiration boolean state
			const date = new Date();
			const isExpired = (pad.expiration < date.getTime());
			return isExpired;
	});
}
exports.isGroupExpiredAsync = isGroupExpiredAsync;

/**
 * @desc: Check if user is authorized to edit or delete a specific entity
 *        An entity can be: thread, post or comment
 */
exports.isUserOwnerAsync = function(userId, collection, entityId) {
	return db.collection(collection).findOneAsync({ '_id': entityId }, { 'authorId': true	})
		.then(function(entity) {
			// If user is not author, reject promise
			if (!utils.equalId(userId, entity.authorId))
				return utils.rejectPromiseWithMessage(401, 'NOT_AUTHORIZED');
			return true;
	});
};

/**
 * @desc: Send email to all users watching the entity (e.g. forum or thread), exept the author
 * @params:
 *    entityId: id of entity users are watching (e.g. forum or thread)
 *    authorId: id of author of the entity
 *    mail: contains subject, subjectParams, body, bodyParams
 **/
exports.sendMailToWatchingUsersAsync = function(entityId, authorId, content) {
	return users.getNotifyUserIdsForEntity(entityId).then(function(userIds) {
		// Remove author from list of userIds
		const userIdsWithoutAuthor = utils.withoutObjectId(userIds, authorId);
		
		// Send mail to all users
		mail.sendMailToUserIds(userIdsWithoutAuthor, content.subject, content.subjectParams, content.body, content.bodyParams);
	});
};

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
exports.isGroupMemberAsync = isGroupMemberAsync;

/**
 * @desc: Checks if user is allowed to create a post or comment
 * 		 First, checks if thread is private
 * 		 If so, check if user is member of group
 * @return: boolean flag, indicating if user is 
 */
exports.isUserAuthorizedToCreateAsync = function(threadId, userId) {
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
};

/**
 * @desc: Check if a user has voted for a specific entity (post or comment)
 */
exports.hasUserVotedAsync = function(entityId, userId) {
	return db.collection('forum_votes').findOneAsync({ 'entityId': entityId, 'userId': userId }).then(function(userVote) {
		// If userVote is null, user has not voted, retun null again, otherwise return vote value (-1, 1)
		return _.isNull(userVote) ? null : userVote.voteValue;
	});
};

/**
 * @desc: Count sum of votes for a specific entity (post or comment)
 */
exports.sumVotesAsync = function(entityId) {
	return db.collection('forum_votes')
		.aggregateAsync([
			{ $match: { 'entityId': entityId } },
			{ $group: { _id: null, 'sumVotes': { $sum: "$voteValue" } } }
		])
		.then(function(group) {
			// If somehting was found, return the sum of votes, otherwise 0
			return group.length > 0 ? group[0].sumVotes : 0;
		});
};
