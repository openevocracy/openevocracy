// General libraries
const _ = require('underscore');
const ObjectId = require('mongodb').ObjectID;

// Import routes
const db = require('../../database').db;
const utils = require('../../utils');

/**
 * @desc: Create and store new poll in databse
 */
exports.createAsync = function(rawPoll, threadId, groupId) {
	if (_.isNull(rawPoll) || rawPoll.options.length < 2)
		return Promise.resolve();

	// Initialize poll options
	const options = rawPoll.options.map((label, index) => {
		return { 'index': index, 'label': label, 'votedUserIds': [] };
	});
	
	// Define poll
	const poll = {
		'groupId': groupId,
		'threadId': threadId,
		'options': options,
		'allowMultipleOptions': rawPoll.allowMultipleOptions,
		'userIdsVoted': []
	};
	
	// Add poll to database
	return db.collection('forum_polls').insertAsync(poll);
};

/**
 * @desc: Gets promise from database by threadId
 */
exports.getAsync = function(threadId) {
	return db.collection('forum_polls').findOneAsync({'threadId': threadId}).then((poll) => {
		if (!poll) {
			// If no poll was found, we assume that no poll was created for this thread, just return null in this case
			return null;
		} else {
			// Add number of group members to poll
			return db.collection('group_relations').countAsync(
				{'groupId': poll.groupId}
			).then((numGroupMembers) => {
				// Pick basic poll values
				const basicPoll = _.pick(poll, '_id', 'options', 'allowMultipleOptions', 'userIdsVoted');
				// Add number of group members to basic poll values
				return {...basicPoll, 'numGroupMembers': numGroupMembers};
			});
		}
	});
};

/**
 * @desc: Stores votes for options in poll
 */
exports.vote = async function(req, res) {
	const userId = ObjectId(req.user._id);
	const pollId = ObjectId(req.params.id);
	const votes = req.body.votes;
	
	// Wait for poll
	const poll = await db.collection('forum_polls').findOneAsync({ '_id': pollId });
	
	/**
	 * Check if user has chosen multiple options and if multiple options are allowed
	 */
	// Number of chosen options is greater one and multiple options are not allowed
	if(votes.length > 1 && !poll.allowMultipleOptions) {
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
	poll.options.forEach((opt) => {
		const optionVoted = votes.includes(opt.index);
		const userVoted = utils.containsObjectId(opt.votedUserIds, userId);
		
		// If current option was voted, add user if not exists
		if (optionVoted && !userVoted) {
			opt.votedUserIds.push(userId);
		}
		
		// If current option was not voted, remove user if exists
		if (!optionVoted && userVoted) {
			const idx = opt.votedUserIds.indexOf(userId);
			opt.votedUserIds.splice(idx, 1);
		}
	});
	
	// Add user to voted users, if not already in
	const undefinedIfUserHasNotVoted = poll.userIdsVoted.find(votedUserId => utils.equalId(votedUserId, userId));
	if (_.isUndefined(undefinedIfUserHasNotVoted))
		poll.userIdsVoted.push(userId);
	
	// Update poll options
	db.collection('forum_polls').updateAsync(
		{ '_id': pollId }, { $set: { 'options': poll.options, 'userIdsVoted': poll.userIdsVoted } }
	).then(res.json.bind(res));
	
};
