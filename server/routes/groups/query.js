// General libraries
const _ = require('underscore');
const ObjectId = require('mongodb').ObjectID;
const Promise = require('bluebird');

// Own references
const db = require('../../database').db;
const utils = require('../../utils');
const pads = require('../pads');
const users = require('../users');
const helper = require('./helper');
const badges = require('./badges');

/**
 * @desc: Gets badged information, needed in group toolbar
 */
exports.badges = function(req, res) {
	const groupId = ObjectId(req.params.id);
	const userId = ObjectId(req.user._id);

	// Get group name and topic id
	const group_promise = db.collection('groups')
		.findOneAsync({ '_id': groupId }).then((group) => {
			return { 'name': group.name, 'topicId': group.topicId };
		});

	// Get topic title
	const topic_promise = group_promise.then((group) => {
		return db.collection('topics')
			.findOneAsync({ '_id': group.topicId }).then((topic) => {
				return { 'topicId': topic._id, 'title': topic.name };
			});
	});

	// Get expiration of group pad
	const pad_promise = db.collection('pads_group')
		.findOneAsync({ 'groupId': groupId }, { 'expiration': true });

	// Get current badge status
	const badge_promise = badges.getBadgeStatusAsync(userId, groupId);

	Promise.join(group_promise, topic_promise, pad_promise, badge_promise)
		.spread((group, topic, pad, badge) => {
			return {
				'groupName': group.name,
				'topicTitle': topic.title,
				'topicId': topic.topicId,
				'padId': pad._id,
				'expiration': pad.expiration,
				'badge': badge
			};
		}).then(res.json.bind(res));
};

/**
 *  @desc: Gets the member bar, which function is to:
 * 		  - show the name and color of every member
 * 		  - highligh which member the current user is
 * 		  - show the online status of every member
 */
exports.memberbar = function(req, res) {
	const groupId = ObjectId(req.params.id);
	const userId = ObjectId(req.user._id);

	// Get group members
	const groupRelations_promise = helper.getGroupMembersAsync(groupId);

	// Get number of group members
	const numGroupMembers_promise = groupRelations_promise.then(function(group_members) {
		return _.size(group_members);
	});

	// Generate group specific color_offset
	const chanceOffset = new Chance(groupId.toString());
	const offset = chanceOffset.integer({ min: 0, max: 360 });

	// Get group members
	groupRelations_promise.map((relation, index) => {

		// Generate member color
		const memberColor_promise = numGroupMembers_promise.then(function(numMembers) {
			const hue = offset + index * (360 / numMembers);
			return Promise.resolve(Color({ h: hue, s: 20, v: 100 }).hex());
		});

		return Promise.props({
			'userId': relation.userId,
			'name': helper.generateMemberName(groupId, relation.userId),
			'color': memberColor_promise,
			'isOnline': users.isOnline(relation.userId)
		});
	}).then(res.json.bind(res));
};

/**
 * @desc: Get currently online members
 */
exports.onlineMembers = function(req, res) {
	const groupId = ObjectId(req.params.id);
	const userId = ObjectId(req.user._id);

	// Get all group relations
	helper.getGroupMembersAsync(groupId).map((relation) => {
		// Check if member is online and return isOnline status
		return {
			'userId': relation.userId,
			'isOnline': users.isOnline(relation.userId)
		};
	}).then(res.json.bind(res));
};

/**
 * @desc: Get basic group information
 */
exports.getBasicGroup = function(req, res) {
	const groupId = ObjectId(req.params.id);
	const userId = ObjectId(req.user._id);

	// Get group
	const group_promise = db.collection('groups').findOneAsync({ '_id': groupId });

	// Get group members
	const groupRelations_promise = helper.getGroupMembersAsync(groupId);

	// Get previous pads
	const prevPads_promise = Promise.join(group_promise, groupRelations_promise).spread(function(group, groupRelations) {
		var prevPadIds = _.pluck(groupRelations, 'prevPadId');
		if (group.level == 0) {
			return db.collection('pads_proposal')
				.find({ '_id': { $in: prevPadIds } }, { 'ownerId': true, 'docId': true }).toArrayAsync();
		}
		else {
			return db.collection('pads_group')
				.find({ '_id': { $in: prevPadIds } }, { 'groupId': true, 'docId': true }).toArrayAsync();
		}
	});

	// Count number of groups in current level to obtain if we are in last group (last level)
	const isLastGroup_promise = group_promise.then(function(group) {
		return db.collection('groups').countAsync({ 'topicId': group.topicId, 'level': group.level })
			.then(function(numGroupsInCurrentLevel) {
				return (numGroupsInCurrentLevel == 1) ? true : false;
			});
	});

	// Get group members
	const groupMembersDetails_promise = groupRelations_promise.map((relation) => {

		// Get proposal html
		const prevPadHtml_promise = Promise.join(group_promise, prevPads_promise).spread(function(group, prevPads) {
			if (group.level == 0) {
				const prevUserPad = utils.findWhereObjectId(prevPads, { 'ownerId': relation.userId });
				return pads.getPadHTMLAsync('proposal', prevUserPad.docId);
			}
			else {
				const prevGroupPad = utils.findWhereObjectId(prevPads, { 'groupId': relation.prevGroupId });
				return pads.getPadHTMLAsync('group', prevGroupPad.docId);
			}
		});

		// Get member ratings
		const memberRatings_promise = ratings.getMemberRatingsAsync(relation.userId, groupId, userId);

		return Promise.props({
			'userId': relation.userId,
			'name': helper.generateMemberName(groupId, relation.userId),
			'color': relation.userColor,
			'prevGroupId': relation.prevGroupId,
			'prevPadHtml': prevPadHtml_promise,
			'ratings': memberRatings_promise
		});
	});

	Promise.join(groupMembersDetails_promise, isLastGroup_promise)
		.spread((groupMembers, isLastGroup) => {
			return { 'members': groupMembers, 'isLastGroup': isLastGroup };
		}).then(res.json.bind(res));
};

/**
 * @desc: Gets group editor information, mainly information about the pad
 */
exports.editor = function(req, res) {
	const groupId = ObjectId(req.params.id);
	const userId = ObjectId(req.user._id);

	// Set lastActivity for the member querying the group
	const lastActivity_promise = db.collection('group_relations')
		.updateAsync({ 'grouId': groupId, 'userId': userId }, { $set: { 'lastActivity': Date.now() } });

	// Get docId from group pad
	const pad_promise = db.collection('pads_group').findOneAsync({ 'groupId': groupId });

	// Get group members
	const groupMembers_promise = helper.getGroupMembersAsync(groupId).map((relation) => {
		return {
			'userId': relation.userId,
			'name': helper.generateMemberName(groupId, relation.userId),
			'color': relation.userColor
		};
	});

	Promise.join(pad_promise, groupMembers_promise, lastActivity_promise)
		.spread((pad, groupMembers) => {
			return {
				'padId': pad._id,
				'docId': pad.docId,
				'members': groupMembers
			};
		}).then(res.json.bind(res));
};
