// General libraries
const _ = require('underscore');
const ObjectId = require('mongodb').ObjectID;
const Promise = require('bluebird');
const Chance = require('chance');

// Own references
const C = require('../../../shared/constants').C;
const cfg = require('../../../shared/config').cfg;
const db = require('../../database').db;
const mail = require('../../mail');
const utils = require('../../utils');
const topics = require('../topics');
const pads = require('../pads');
const users = require('../users');
const activities = require('../activities');
const ratings = require('./ratings');
const badges = require('./badges');
const helper = require('./helper');

/**
 * @desc: Calculate number of groups in topic, depending on group size
 * 		 Important for assigning participants to groups
 */
function calculateNumberOfGroups(numTopicParticipants) {
	
	// TODO throw error if group size is smaller than 3
	//if(cfg.GROUP_SIZE < 3)
	
	var numGroups = Math.ceil(numTopicParticipants/cfg.GROUP_SIZE); // round up to next integer
	console.log('number of groups: ', numGroups);
	
	return numGroups;
}

/**
 * @desc: Randomly assigns participants to groups
 */
function assignParticipantsToGroups(participants) {
	// Shuffle topic participants
	_.shuffle(participants);
	
	// Compute number of groups
	var numGroups = calculateNumberOfGroups(_.size(participants));
	
	// Initialize groups (as empty array)
	var groups = new Array(numGroups);
	for(var i=0; i<numGroups; ++i)
		groups[i] = [];
    
	// Push topic participants into groups
	_.each(participants, function(participant) {
		// Find first smallest group
		var group = _.min(groups, function(group) {return _.size(group);});
		group.push(participant);
	});
    
	// TODO log with logging library
	// Log group member distribution
	var counts = _.countBy(groups, function(group) {return _.size(group);});
	console.log('groups filled: ' + JSON.stringify(counts));
	
	return groups;
}

/*
 * @desc: Store group, group pad and members in database
 *        Called from initial creation and remix
 * @params:
 *    groupId: id of the new group
 *    topicId: id of the related topic
 *    padId: id of the related pad
 *    groupRelations: relations of group (user, previous pad, previous group)
 *    nextDeadline: deadline of the next stage (not the old one)
 *    level: new level (old level +1)
 */
function storeGroupAsync(groupId, topicId, padId, groupRelations, nextDeadline, level) {
	const chatRoomId = ObjectId();
	const forumId = ObjectId();
	
	// Sample group name
	const groupName_promise = db.collection('groups').find({ 'topicId': topicId }, { 'name': true }).toArrayAsync()
		.then(function(groups) {
			// Initialize chance and sample city
			const cityChance = new Chance(groupId.toString());
			let groupName = cityChance.city();
			
			// Get groups names as array
			const groupNames = _.pluck(groups, 'name');
			
			// Sample another group name, until group name is unique in this topic
			while(_.contains(groupNames, groupName)) {
				groupName = cityChance.city();
			}
			
			return groupName;
	});
	
	// Create group itself
	const createGroup_promise = groupName_promise.then(function(groupName) {
		// Define group data
		const group = {
			'_id': groupId, 'name': groupName, 'level': level,
			'topicId': topicId, 'chatRoomId': chatRoomId, 'forumId': forumId
		};
		
		// Store group in database
		return db.collection('groups').insertAsync(group);
	});
	
	// Create group pad
	const pad = { '_id': padId, 'topicId': topicId, 'groupId': groupId, 'expiration': nextDeadline };
	const createPadProposal_promise = pads.createPadAsync(pad, 'group');
	
	// Create forum for group
	const forum = { '_id': forumId, 'groupId': groupId };
	const createForum_promise = db.collection('forums').insertAsync(forum);
	
	// Sample colors for users
	const userColors = helper.generateMemberColors(groupId, _.pluck(groupRelations, 'userId'));
	console.log('storeGroupAsync userColors', userColors);
	
	// Store group members
	const members_promise = Promise.map(groupRelations, function(rel, index) {
		// Enable email notifications of member for the forum
		const enableNotify_promise = users.enableEmailNotifyAsync(rel.userId, forumId);
		
		// Add member to group relations collection
		const prevGroupId = _.isUndefined(rel.prevGroupId) ? null : rel.prevGroupId;
		const insert = {
			'groupId': groupId,
			'userId': rel.userId,
			'userColor': userColors[index],
			'prevGroupId': prevGroupId,
			'prevPadId': rel.prevPadId,
			'lastActivity': -1
		};
		const groupRelations_promise = db.collection('group_relations').insertAsync(insert);
		
		// Set members badge
		badges.updateMembersBadge(rel.userId, groupId);
		
		// Return promises
		return Promise.join(enableNotify_promise, groupRelations_promise);
	});
	
	return Promise.join(createPadProposal_promise, createGroup_promise, createForum_promise, members_promise);
}


/**
 * @desc: initial creation of groups after proposal stage
 *        - check if user proposals are valid (filter participants)
 *        - randomly assign participants to groups
 */
exports.createGroupsAsync = function(topic) {
	var topicId = topic._id;
	
	var validParticipants_promise = db.collection('pads_proposal')
		.find({ 'topicId': topicId }).toArrayAsync()
		.map(function(pad) {
			// Get html of doc and add valid status to pad object
			return pads.getPadHTMLAsync('proposal', pad.docId).then(function(html) {
				return _.extend(pad, {'valid': helper.isProposalValid(html)});
			});
		}).then(function(pads) {
			// Filter by valid status and return id's of users
			return _.pluck(_.filter(pads, function(pad) {
				return pad.valid;
			}), 'ownerId');
	});
	
	var storeValidParticipantsPromise = validParticipants_promise.then(function(validParticipants) {
		console.log(validParticipants);
		return db.collection('topics').updateAsync(
			{ '_id': topic._id },
			{ $set: { 'validParticipants': _.size(validParticipants) } });
	});
	
	// Create group and notify members
	const createGroupsPromise = validParticipants_promise.then(function(validParticipants) {
		return assignParticipantsToGroups(validParticipants);
	}).map(function(group_members) {
		// Create new group id
		const topicId = topic._id;
		const groupId = ObjectId();
		
		// TODO Notifications
		// Send mail to notify new group members
		const send_mail_promise = db.collection('users')
			.find({'_id': { $in: group_members }}, {'email': true}).toArrayAsync()
			.then(function(users) {
				mail.sendMailMulti(users,
					'EMAIL_CONSENSUS_START_SUBJECT', [topic.name],
					'EMAIL_CONSENSUS_START_MESSAGE', [topic.name, groupId.toString(), cfg.PRIVATE.BASE_URL]);
		});
		
		// Get group relations (previous pad ids and member ids)
		// Note: previous group id is not possible here, since initially there is no previous group
		const groupRelations_promise = db.collection('pads_proposal')
			.find({ 'topicId': topicId, 'ownerId': {$in: group_members} }, {'_id': true, 'ownerId': true}).toArrayAsync()
			.map(function(rawGroupRelation) {
				return { 'prevPadId': rawGroupRelation._id, 'userId': rawGroupRelation.ownerId };
		});
		
		// Store group in database
		const padId = ObjectId();
		const nextDeadline = topic.nextDeadline;
		const store_group_promise = groupRelations_promise.then(function(groupRelations) {
			console.log('groupRelations', groupRelations);
			return storeGroupAsync(groupId, topicId, padId, groupRelations, nextDeadline, 0);
		});
		
		// Join promises and return group members
		return Promise
			.join(send_mail_promise, store_group_promise)
			.return(group_members);
	});
    
	return Promise.join(createGroupsPromise, storeValidParticipantsPromise).get(0);
};


/**
 * @desc: Create groups after level is finished
 *        - Check if group proposals are valid (filter groups)
 *        - Find group leader (with highest rating)
 *        - Randomly assign participants to new groups
 *        - Store previous groups in new group
 */
exports.remixGroupsAsync = function(topic) {
    var topicId = topic._id;
    
    // Get groups with highest level
    var groups_promise = helper.getValidGroupsOfSpecificLevelAsync(topicId, topic.level);
    
	// Get group leaders
	var leaders_promise = groups_promise.map(function(group_in) {
		var groupId = group_in._id;
		
		return ratings.getGroupLeaderAsync(groupId).then(function(leader) {
			if(!_.isUndefined(leader))
				return Promise.resolve(leader);
			
			// If group leader is undefined, pick one randomly
			return helper.getGroupMembersAsync(groupId).then(function(members) {
				return Promise.resolve(_.sample(members).userId);
			});
		});
	});
	
    
	return Promise.join(groups_promise, leaders_promise).spread(function(groups, leaders) {
		/*
		 * If there is NO group in the current topic level, there was not only one valid document in the current level
		 */
		if(_.size(groups) == 0)
			return Promise.reject({ 'reason': 'REJECTED_NO_VALID_GROUP_PROPOSAL' });
		
		/*
		 * If there is only ONE group in the current topic level, then the topic is finished/passed
		 */
		if(_.size(groups) == 1) {
			// Send mail to ALL initial participants and notifiy about finished topic
			// finally return next stage
			return db.collection('groups')
				.find({ 'topicId': topic._id, 'level': 0 }). toArrayAsync()
				.then(function(groups) {
					return db.collection('group_relations').find({'groupId': { $in: _.pluck(groups, '_id') }}, {'userId': true}).toArrayAsync();
				}).then(function(participants) {
					return db.collection('users')
						.find({'_id': { $in: _.pluck(participants, 'userId') }}, {'email': true}).toArrayAsync()
						.then(function(users) {
							mail.sendMailMulti(users,
								'EMAIL_TOPIC_PASSED_SUBJECT', [topic.name],
								'EMAIL_TOPIC_PASSED_MESSAGE', [topic.name, topic._id, cfg.PRIVATE.BASE_URL]);
					});
				}).return({'nextStage': C.STAGE_PASSED});
		}
       
      /* 
       * If there is more than one group in the current topic level, prepare next level
       */
		// Assign members to groups
		var groupsMemberIds_promise = assignParticipantsToGroups(leaders);
		
		// Add activities for all delegates
		const createActivity_promise = groupsMemberIds_promise.then((leaders) => {
			_.each(leaders, function(el) {
				console.log("Leader", el)
				activities.storeActivity(el, C.ACT_ELECTED_DELEGATE, topicId);
			});
		});
		
		// Insert all groups into database
		var nextLevel = topic.level+1;
		return Promise.map(groupsMemberIds_promise, function(groupMemberIds) {
         // Get group relations (prevPadIds, prevGroupIds and member ids)
			var groupRelations_promise = db.collection('group_relations')
				.find({ 'groupId': {$in: _.pluck(groups, '_id')}, 'userId': {$in: groupMemberIds} }, { 'groupId': true, 'userId': true }).toArrayAsync()
				.then(function(prevGroups) {
					console.log('groupRelations_promise', prevGroups);
					// prevGroupIds and member ids are already given, prevPadIds need to be found (= current group pads)
					var prevGroupIds = _.pluck(prevGroups, 'groupId');
					var prevPads_promise = db.collection('pads_group').find({'groupId': {$in: prevGroupIds}}, {'_id': true, 'groupId': true}).toArrayAsync();
					// Return both information
					return Promise.join(prevGroups, prevPads_promise);
			}).spread(function(prevGroups, prevPads) {
				console.log('BEFORE', prevGroups, prevPads);
				// Bring both information in form
				prevGroups = _.map(prevGroups, function(g) {
					return { 'prevGroupId': g.groupId, 'userId': g.userId };
				});
				prevPads = _.map(prevPads, function(p) {
					return { 'prevGroupId': p.groupId, 'prevPadId': p._id };
				});
				console.log('AFTER', prevGroups, prevPads);
				return utils.mergeCollections(prevGroups, prevPads, 'prevGroupId');
			});
         
         // Initalize group variables
         var groupId = ObjectId();
         var topicId = topic._id;
         var padId = ObjectId();
         var prevDeadline = topic.nextDeadline;
         var nextDeadline = topics.calculateDeadline(C.STAGE_CONSENSUS, prevDeadline);
         
         // Store group in database
         var storeGroup_promise = groupRelations_promise.then(function(groupRelations) {
         	return storeGroupAsync(groupId, topicId, padId, groupRelations, nextDeadline, nextLevel);
         });
         
         // Send mail to notify level change
         var sendMail_promise = db.collection('users')
				.find({'_id': {$in: groupMemberIds}}, {'email': true}).toArrayAsync().then(function(users) {
					mail.sendMailMulti(users,
						'EMAIL_LEVEL_CHANGE_SUBJECT', [topic.name],
						'EMAIL_LEVEL_CHANGE_MESSAGE', [topic.name, groupId.toString(), cfg.PRIVATE.BASE_URL]);
         });
            
			return Promise.join(sendMail_promise, storeGroup_promise);
		}).return({'nextStage': C.STAGE_CONSENSUS});  // We stay in consensus stage
	}).catch(function(error) {
		return {
			'nextStage': C.STAGE_REJECTED,
			'rejectedReason': error.reason
		};
	});
};

