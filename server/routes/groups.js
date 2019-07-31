// General libraries
var _ = require('underscore');
var db = require('../database').db;
var ObjectId = require('mongodb').ObjectID;
var Promise = require('bluebird');
var Chance = require('chance');
var Color = require('color');

// Own references
var C = require('../../shared/constants').C;
var cfg = require('../../shared/config').cfg;
var ratings = require('./ratings');
var topics = require('./topics');
var pads = require('./pads');
var mail = require('../mail');
var utils = require('../utils');

function getGroupMembersAsync(groupId) {
	return db.collection('group_relations').find({'groupId': groupId}).toArrayAsync();
}

function calculateNumberOfGroups(numTopicParticipants) {
	
	// TODO throw error if group size is smaller than 3
	//if(cfg.GROUP_SIZE < 3)
	
	var numGroups = Math.ceil(numTopicParticipants/cfg.GROUP_SIZE); // round up to next integer
	console.log('number of groups: ', numGroups);
	
	return numGroups;
}

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
 * @desc: Generate username from chance library, using groupId and userId as seed
 */
 
function generateUserName(groupId, userId) {
	// Create new chance object, which seed exists out of groupId and userId
   const seed = groupId.toString()+userId.toString();
   const chanceName = new Chance(seed);
   
   // Generate name and return
   return chanceName.first();
}
exports.generateUserName = generateUserName;

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
	var chatRoomId = ObjectId();
	var forumId = ObjectId();
	
	// Create group itself
	var group = { '_id': groupId, 'topicId': topicId, 'chatRoomId': chatRoomId, 'forumId': forumId, 'level': level };
	var createGroup_promise =	db.collection('groups').insertAsync(group);
	
	// Create group pad
	var pad = { '_id': padId, 'topicId': topicId, 'groupId': groupId, 'expiration': nextDeadline };
	var createPadProposal_promise = pads.createPadAsync(pad, 'group');
	
	// Create forum for group
	var forum = { '_id': forumId, 'groupId': groupId };
	var createForum_promise = db.collection('forums').insertAsync(forum);
	
	// Insert group members to database
	var insertMembers_promise =
	db.collection('group_relations').insertAsync(
		_.map(groupRelations, function(rel) {
			var prevGroupId = _.isUndefined(rel.prevGroupId) ? null : rel.prevGroupId;
			return { 'groupId': groupId, 'userId': rel.userId, 'prevGroupId': prevGroupId, 'prevPadId': rel.prevPadId, 'lastActivity': -1 };
		})
	);
	
	return Promise.join(createPadProposal_promise, createGroup_promise, createForum_promise, insertMembers_promise);
}

/**
 * @desc: Check if specific proposal is valid, return true or false
 * @param:
 *     html: text of the proposal as html
 */
function isProposalValid(html) {
	// Valid if number of words in html is greater than configured threshold
	return utils.countHtmlWords(html) >= cfg.MIN_WORDS_PROPOSAL;
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
				return _.extend(pad, {'valid': isProposalValid(html)});
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
	var createGroupsPromise = validParticipants_promise.then(function(validParticipants) {
		return assignParticipantsToGroups(validParticipants);
	}).map(function(group_members) {
		// Create new group id
		var topicId = topic._id;
		var groupId = ObjectId();
		
		// TODO Notifications
		// Send mail to notify new group members
		var send_mail_promise = db.collection('users')
			.find({'_id': { $in: group_members }}, {'email': true}).toArrayAsync()
			.then(function(users) {
				mail.sendMailMulti(users,
					'EMAIL_CONSENSUS_START_SUBJECT', [topic.name],
					'EMAIL_CONSENSUS_START_MESSAGE', [topic.name, groupId.toString(), cfg.PRIVATE.BASE_URL]);
		});
		
		// Get group relations (previous pad ids and member ids)
		// Note: previous group id is not possible here, since initially there is no previous group
		var groupRelations_promise = db.collection('pads_proposal')
			.find({ 'topicId': topicId, 'ownerId': {$in: group_members} }, {'_id': true, 'ownerId': true}).toArrayAsync()
			.map(function(rawGroupRelation) {
				return { 'prevPadId': rawGroupRelation._id, 'userId': rawGroupRelation.ownerId };
			});
			
			
		
		// Store group in database
		var padId = ObjectId();
		var nextDeadline = topic.nextDeadline;
		var store_group_promise = groupRelations_promise.then(function(groupRelations) {
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

function getGroupsOfSpecificLevelAsync(topicId, level) {
    return db.collection('groups').find({ 'topicId': topicId, 'level': level }).toArrayAsync();
}
exports.getGroupsOfSpecificLevelAsync = getGroupsOfSpecificLevelAsync;

function getValidGroupsOfSpecificLevelAsync(topicId, level) {
	return getGroupsOfSpecificLevelAsync(topicId, level).filter(function (group) {
		return db.collection('pads_group').findOneAsync({'groupId': group._id})
			.then(function(proposal) {
				// Get HTML from document
				proposal.body = pads.getPadHTMLAsync('group', proposal.docId);
				return Promise.props(proposal);
			}).then(function(proposal) {
				console.log('html', proposal.body);
				console.log('isValid', isProposalValid(proposal.body));
				// Check if proposal is valid
				return isProposalValid(proposal.body);
			});
	}).then(function(groups) {
		console.log('groups', groups);
		// If no valid proposal exists: reject, otherwise return all valid groups
		if(_.isEmpty(groups))
			return Promise.reject({reason: 'REJECTED_NO_VALID_GROUP_PROPOSAL'});
		else
			return Promise.resolve(groups);
	});
}

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
    var groups_promise = getValidGroupsOfSpecificLevelAsync(topicId, topic.level);
    
	// Get group leaders
	var leaders_promise = groups_promise.map(function(group_in) {
		var groupId = group_in._id;
		
		return ratings.getGroupLeaderAsync(groupId).then(function(leader) {
			if(!_.isUndefined(leader))
				return Promise.resolve(leader);
			
			// If group leader is undefined, pick one randomly
			return getGroupMembersAsync(groupId).then(function(members) {
				return Promise.resolve(_.sample(members).userId);
			});
		});
	});
    
	return Promise.join(groups_promise, leaders_promise).spread(function(groups, leaders) {
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
	}).catch(utils.isOwnError,function(error) {
		return {
			'nextStage': C.STAGE_REJECTED,
			'rejectedReason': error.reason
		};
	});
};

/* @desc: Gets group editor information, necessary information are:
 *        - groupId, topicId, docId (can be found in pad)
 *        - level, name, nextDeadline (can be found in topic)
 *        - chatRoomId (can be found in group)
 *        - isLastGroup
 *        - members (includes: color, name, userId, ratingIntegration, ratingKnowledge)
 */
exports.query = function(req, res) {
	var padId = ObjectId(req.params.id);
	var userId = ObjectId(req.user._id);
	
	// Get docId, groupId and topicId from group pad
	var pad_promise = db.collection('pads_group').findOneAsync({'_id': padId});
	
	// Everything else depends on pad
	pad_promise.then(function(pad) {
		// Define some variables for simpler and more intuitie use
		var groupId = pad.groupId;
		var topicId = pad.topicId;
		
		/*
		 * Simple stuff
		 */
		
		// Get topic name
		var topic_promise = db.collection('topics').findOneAsync({'_id': topicId}, {'name': true});
		
		// Get chatRoomId from group
		var group_promise = db.collection('groups').findOneAsync({'_id': pad.groupId});
		
		// Count number of groups in current level to obtain if we are in last group (last level)
		var isLastGroup_promise = group_promise.then(function(currentGroup) {
			return db.collection('groups').countAsync({ 'topicId': currentGroup.topicId, 'level': currentGroup.level })
				.then(function(numGroupsInCurrentLevel) {
					return (numGroupsInCurrentLevel == 1) ? true : false;
			});
		});
		
		/*
		 * Group Members
		 */
		
		// Get group members
		var groupRelations_promise = getGroupMembersAsync(groupId);
		
		// Get number of group members
		var num_group_members_promise = groupRelations_promise.then(function(group_members) {
			return _.size(group_members);
		});
		
		// Generate group specific color_offset
		const chanceOffset = new Chance(groupId.toString());
		const offset = chanceOffset.integer({min: 0, max: 360});
		
		// Get previous pads
		var prevPads_promise = Promise.join(group_promise, groupRelations_promise).spread(function(group, groupRelations) {
			var prevPadIds = _.pluck(groupRelations, 'prevPadId');
			if (group.level == 0) {
				return db.collection('pads_proposal')
					.find({ '_id': {$in: prevPadIds} }, { 'ownerId': true, 'docId': true }).toArrayAsync();
			} else {
				return db.collection('pads_group')
					.find({ '_id': {$in: prevPadIds} }, { 'groupId': true, 'docId': true }).toArrayAsync();
			}
		});
		
		// Get group members
		var groupMembersDetails_promise = groupRelations_promise.map(function(relation, index) {
			
			// Generate member color
			var memberColor_promise = num_group_members_promise.then(function(numMembers) {
				var hue = offset + index*(360/numMembers);
				return Promise.resolve(Color({h: hue, s: 20, v: 100}).hex());
			});
         
         // Get proposal html
         var prevPadHtml_promise = Promise.join(group_promise, prevPads_promise).spread(function(group, prevPads) {
         	if (group.level == 0) {
	         	var prevUserPad = utils.findWhereObjectId(prevPads, {'ownerId': relation.userId});
	         	return pads.getPadHTMLAsync('proposal', prevUserPad.docId);
         	} else {
         		var prevGroupPad = utils.findWhereObjectId(prevPads, {'groupId': relation.prevGroupId});
         		return pads.getPadHTMLAsync('group', prevGroupPad.docId);
         	}
         });
			
			// Get member rating
			var memberRatingKnowledge_promise = ratings.getMemberRatingAsync(relation.userId, groupId, userId, C.RATING_KNOWLEDGE);
			var memberRatingIntegration_promise = ratings.getMemberRatingAsync(relation.userId, groupId, userId, C.RATING_INTEGRATION);
         
         return Promise.props({
         	'userId': relation.userId,
				'name': generateUserName(groupId, relation.userId),
				'color': memberColor_promise,
				'prevPadHtml': prevPadHtml_promise,
				'ratingKnowledge': memberRatingKnowledge_promise,
				'ratingIntegration': memberRatingIntegration_promise
         });
		});
		
		// Finally, set lastActivity for the member querying the group
		var lastActivity_promise = db.collection('group_relations')
			.updateAsync({ 'grouId': groupId, 'userId': userId }, { $set: {'lastActivity': Date.now()} });
		
		// Collect all information and return
		return Promise.join(topic_promise, group_promise, isLastGroup_promise, groupMembersDetails_promise, lastActivity_promise)
			.spread(function(topic, group, isLastGroup, group_members) {
				return {
					'groupId': groupId,
					'topicId': topicId,
					'docId': pad.docId,
					'level': group.level,
					'title': topic.name,
					'deadline': pad.expiration,
					'chatRoomId': group.chatRoomId,
					'forumId': group.forumId,
					'isLastGroup': isLastGroup,
					'members': group_members
				};
		});
	}).then(res.json.bind(res));
};
