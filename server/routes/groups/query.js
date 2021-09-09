// General libraries
const _ = require('underscore');
const ObjectId = require('mongodb').ObjectID;
const Promise = require('bluebird');

// Own references
const db = require('../../database').db;
const utils = require('../../utils');
const manageTopic = require('../topics/manage');
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

	// Get current badge status
	badges.getBadgeStatusAsync(userId, groupId).then(res.json.bind(res));
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
exports.getBasicGroup = async function(req, res) {
	const groupId = ObjectId(req.params.id);
	const userId = ObjectId(req.user._id);
	
	// Set lastActivity for the member querying the group
	const lastActivity_promise = db.collection('group_relations')
		.updateAsync({ 'groupId': groupId, 'userId': userId }, { $set: {'lastActivity': Date.now()} });
	
	// Get topicId
	const topicId = await db.collection('groups')
		.findOneAsync({ '_id': groupId }, { 'topicId': true })
		.then((group) => group.topicId);
	
	// Get topic
	let topic = await db.collection('topics').findOneAsync({ '_id': topicId });
	
	// First manage topic stage and see if goup needs to jump to next stage/level
	topic = await manageTopic.manageTopicStateAsync(topic);
	
	// Get group
	const group_promise = db.collection('groups').findOneAsync({ '_id': groupId });
	
	// Get group members
	const groupRelations_promise = helper.getGroupMembersAsync(groupId);
	
	// Resolve group and group member promises
	const [group, groupRelations] = await Promise.all([group_promise, groupRelations_promise]);
	
	// Get previous pads
	const prevPads_promise = Promise.join(group_promise, groupRelations_promise).spread(function(group, groupRelations) {
		const prevPadIds = _.pluck(groupRelations, 'prevPadId');
		if (group.level == 0) {
			return db.collection('pads_proposal')
				.find({ '_id': {$in: prevPadIds} }, { 'authorId': true, 'docId': true }).toArrayAsync();
		} else {
			return db.collection('pads_group')
				.find({ '_id': {$in: prevPadIds} }, { 'groupId': true, 'docId': true }).toArrayAsync();
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
         	const prevUserPad = utils.findWhereObjectId(prevPads, {'authorId': relation.userId});
         	return pads.getPadHTMLAsync('proposal', prevUserPad.docId);
      	} else {
      		const prevGroupPad = utils.findWhereObjectId(prevPads, {'groupId': relation.prevGroupId});
      		return pads.getPadHTMLAsync('group', prevGroupPad.docId);
      	}
      });
      
      return Promise.props({
      	'userId': relation.userId,
			'name': relation.userName,
			'color': relation.userColor,
			'prevGroupId': relation.prevGroupId,
			'prevPadHtml': prevPadHtml_promise
      });
	});
	
	// Get pad
	const pad_promise = helper.getGroupPad(groupId);
	
	// Return result
	Promise.join(group_promise, isLastGroup_promise, groupMembersDetails_promise, pad_promise, lastActivity_promise)
		.spread((group, isLastGroup, groupMembersDetails, pad) => {
		
		return {
			'groupId': groupId,
			'groupName': group.name,
			'groupLevel': group.level,
			'groupNumber': group.num,
			'padId': pad._id,
			'expiration': pad.expiration,
			'docId': pad.docId,
			'padHtml': pad.html,
			'isLastGroup': isLastGroup,
			'members': groupMembersDetails,
			'topicId': topic._id,
			'topicName': topic.name
		};
	}).then(res.json.bind(res));
};
