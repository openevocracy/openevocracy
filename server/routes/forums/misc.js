// General libraries
const ObjectId = require('mongodb').ObjectID;

// Import routes
const db = require('../../database').db;
const utils = require('../../utils');

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
};
