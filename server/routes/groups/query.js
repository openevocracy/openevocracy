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
exports.getBasicGroup = function(req, res) {
	const groupId = ObjectId(req.params.id);
	const userId = ObjectId(req.user._id);
	
	// Set lastActivity for the member querying the group
	const lastActivity_promise = db.collection('group_relations')
		.updateAsync({ 'grouId': groupId, 'userId': userId }, { $set: {'lastActivity': Date.now()} });
	
	// Get group name
	const group_promise = db.collection('groups').findOneAsync({ '_id': groupId });
	
	// Get group members
	const groupRelations_promise = helper.getGroupMembersAsync(groupId);
	
	// Get previous pads
	const prevPads_promise = Promise.join(group_promise, groupRelations_promise).spread(function(group, groupRelations) {
		var prevPadIds = _.pluck(groupRelations, 'prevPadId');
		if (group.level == 0) {
			return db.collection('pads_proposal')
				.find({ '_id': {$in: prevPadIds} }, { 'ownerId': true, 'docId': true }).toArrayAsync();
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
         	const prevUserPad = utils.findWhereObjectId(prevPads, {'ownerId': relation.userId});
         	return pads.getPadHTMLAsync('proposal', prevUserPad.docId);
      	} else {
      		const prevGroupPad = utils.findWhereObjectId(prevPads, {'groupId': relation.prevGroupId});
      		return pads.getPadHTMLAsync('group', prevGroupPad.docId);
      	}
      });
      
      return Promise.props({
      	'userId': relation.userId,
			'name': helper.generateMemberName(groupId, relation.userId),
			'color': relation.userColor,
			'prevGroupId': relation.prevGroupId,
			'prevPadHtml': prevPadHtml_promise
      });
	});
	
	// Get topic name
	const topic_promise = group_promise.then((group) => {
		return db.collection('topics').findOneAsync({ '_id': group.topicId }, { 'name': true });	
	});
	
	// Get expiration date
	const pad_promise = db.collection('pads_group').findOneAsync({'groupId': groupId}, { 'expiration': true, 'docId': true })
		.then((pad) => {
			return pads.getPadHTMLAsync('group', pad.docId).then((padHtml) => {
				return { 'html': padHtml, ...pad };
			});
	});
	
	// Return result
	Promise.join(group_promise, isLastGroup_promise, groupMembersDetails_promise, topic_promise, pad_promise, lastActivity_promise)
		.spread((group, isLastGroup, groupMembersDetails, topic, pad) => {
		
		return {
			'groupId': groupId,
			'groupName': group.name,
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
