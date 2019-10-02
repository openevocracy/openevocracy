// General libraries
const ObjectId = require('mongodb').ObjectID;

// Import routes
const db = require('../../database').db;
const utils = require('../../utils');
const groups = require('../groups');

/**
 * @desc: Vote for entity (post or comment)
 */
exports.vote = function(req, res) {
	const userId = ObjectId(req.user._id);
	const entityId = ObjectId(req.body.entityId);
	const voteValue = req.body.voteValue;
	
	// Define search pattern for database request (user voted for entity)
	const userEntityRelation = {
		'userId': userId,
		'entityId': entityId
	};
	
	Promise.resolve().then(() => {
		// Check if vote value is -1, 0 or 1
		if (voteValue != -1 && voteValue != 0 && voteValue != 1) {
			utils.sendMessage(400, 'VOTE_VALUE_ERROR');
			return;
		}
		
		// If vote value is 0, remove entity row from databse, otherwise update value
		if (voteValue == 0) {
			// Remove vote value
			return db.collection('forum_votes').removeAsync(userEntityRelation);
		} else {
			// Update vote value
			return db.collection('forum_votes')
				.updateAsync(userEntityRelation, { $set: {'voteValue': voteValue} }, { 'upsert': true });
		}
	}).then(res.json.bind(res)).catch(utils.isOwnError, utils.handleOwnError(res));
};

/**
 * desc: Sets viewed status of thread (badge in toolbar and threads visited)
 */
exports.threadVisited = function(groupId, threadId, authorId) {
	return groups.helper.getGroupMembersAsync(groupId).map((rel) => {
		// Do not do anything for author
		if (utils.equalId(rel.userId, authorId))
			return Promise.resolve(null);
		
		// Remove current thread from viewed list for user
		const threadViewed_promise = db.collection('forum_threads_viewed')
			.updateAsync({ 'userId': rel.userId }, { $pull: { 'viewed': threadId } });
		
		// Update toolbar badge
		const badges_promise = groups.badges.updateForumBadge(rel.userId, groupId);
		
		return Promise.all([threadViewed_promise, badges_promise]);
	});
};
