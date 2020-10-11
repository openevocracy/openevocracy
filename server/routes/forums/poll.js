// General libraries
const _ = require('underscore');
const ObjectId = require('mongodb').ObjectID;

// Import routes
const db = require('../../database').db;
const utils = require('../../utils');

/**
 * @desc: Stores votes for options in poll
 */
exports.vote = async function(req, res) {
	const userId = ObjectId(req.user._id);
	const pollId = ObjectId(req.params.id);
	const votes = req.body.votes;
	
	/**
	 * Check if at least one option was chosen
	 */ 
	const numChosenOptions = votes.reduce((tot, num) => tot + num);
	if (numChosenOptions == 0) {
		res.status(400).send('NO_OPTION_CHOSEN');
		return;
	}
	
	// Wait for poll
	const poll = await db.collection('forum_polls').findOneAsync({ '_id': pollId });
	
	/**
	 * Check if user has not already voted
	 */
	// Look if userId is stored in already voted user ids
	const hasUserNotVoted = poll.userIdsVoted.find(votedUserId => utils.equalId(votedUserId, userId));
	// If hasUserNotVoted is not undefined, user has already voted
	if (!_.isUndefined(hasUserNotVoted)) {
		res.status(401).send('ALREADY_VOTED');
		return;
	}
	
	/**
	 * Check if user has chosen multiple options and if multiple options are allowed
	 */
	// Number of chosen options is greater one and multiple options are not allowed
	if(numChosenOptions > 1 && !poll.allowMultipleOptions) {
		res.status(400).send('MULTIPLE_OPTIONS_NOT_ALLOWED');
		return;
	}
	
	/**
	 * Check if user has permission to vote (= if user is member of group)
	 */
	const hasUserPermission = await db.collection('group_relations')
		.find({ 'groupId': poll.groupId }, { 'userId': true })
		.toArrayAsync().then((groupMembers) => {
			// Look for current user in group members array
			const userIsMember = groupMembers.find(member => utils.equalId(member.userId, userId));
			// Return permission status as boolean
			return !_.isUndefined(userIsMember);
		});
	// If user has no permission, reject
	if (!hasUserPermission) {
		res.status(401).send('NO_PERMISSION');
		return;
	}
	
	/**
	 * Update poll
	 */
	// Increment options counts
	votes.forEach((vote, index) => {
		let option = _.findWhere(poll.options, { 'index': index });
		option.count += vote;
	});
	
	// Add user to voted users
	poll.userIdsVoted.push(userId);
	
	// Update poll options and voted userIds
	db.collection('forum_polls').updateAsync(
		{ '_id': pollId }, { $set: { 'options': poll.options, 'userIdsVoted': poll.userIdsVoted } }
	).then(res.json.bind(res));
	
};
