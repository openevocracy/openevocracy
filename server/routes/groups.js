// General libraries
const _ = require('underscore');
const db = require('../database').db;
const ObjectId = require('mongodb').ObjectID;
const Promise = require('bluebird');
const Chance = require('chance');
const Color = require('color');

// Own references
const C = require('../../shared/constants').C;
const cfg = require('../../shared/config').cfg;
const ratings = require('./ratings');
const topics = require('./topics');
const pads = require('./pads');
const users = require('./users');
const mail = require('../mail');
const utils = require('../utils');

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
	
	// Store group members
	const members_promise = Promise.map(groupRelations, function(rel) {
		// Enable email notifications of member for the forum
		const enableNotify_promise = users.enableEmailNotifyAsync(rel.userId, forumId);
		
		// Add member to group relations collection
		const prevGroupId = _.isUndefined(rel.prevGroupId) ? null : rel.prevGroupId;
		const insert = { 'groupId': groupId, 'userId': rel.userId, 'prevGroupId': prevGroupId, 'prevPadId': rel.prevPadId, 'lastActivity': -1 };
		const groupRelations_promise = db.collection('group_relations').insertAsync(insert);
		
		// Return promises
		return Promise.join(enableNotify_promise, groupRelations_promise);
	});
	
	return Promise.join(createPadProposal_promise, createGroup_promise, createForum_promise, members_promise);
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
		 * If there is NO group in the current topic level, there was not only one valid document in the current level
		 */
		if(_.size(groups) == 0) {
			return Promise.reject({'reason': 'REJECTED_NO_VALID_GROUP_PROPOSAL'});
		}
		
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

/**
 * @desc: Gets all data necessary for the group toolbar
 */
exports.getToolbar = function(req, res) {
	const groupId = ObjectId(req.params.id);
	const userId = ObjectId(req.user._id);
	
	const group_promise = db.collection('groups')
		.findOneAsync({ '_id': groupId }).then((group) => {
			return { 'name': group.name, 'topicId': group.topicId };
	});
	
	const topic_promise = group_promise.then((group) => {
		return db.collection('topics')
			.findOneAsync({ '_id': group.topicId }).then((topic) => {
				return { 'title': topic.name };
		});
	});
		
	Promise.join(group_promise, topic_promise).spread((group, topic) => {
		return { 'groupName': group.name, 'topicTitle': topic.title };
	}).then(res.json.bind(res));
};

/**
 *  @desc: Gets the member bar, which function is to:
 * 		  - show the name and color of every member
 * 		  - highligh which member the current user is
 * 		  - show the online status of every member
 */
 exports.getMemberbar = function(req, res) {
	const groupId = ObjectId(req.params.id);
	const userId = ObjectId(req.user._id);
	
	// Get group members
	const groupRelations_promise = getGroupMembersAsync(groupId);
	
	// Get number of group members
	const numGroupMembers_promise = groupRelations_promise.then(function(group_members) {
		return _.size(group_members);
	});
	
	// Generate group specific color_offset
	const chanceOffset = new Chance(groupId.toString());
	const offset = chanceOffset.integer({min: 0, max: 360});
	
	// Get group members
	groupRelations_promise.map(function(relation, index) {
		
		// Generate member color
		const memberColor_promise = numGroupMembers_promise.then(function(numMembers) {
			const hue = offset + index*(360/numMembers);
			return Promise.resolve(Color({h: hue, s: 20, v: 100}).hex());
		});
      
      return Promise.props({
      	'userId': relation.userId,
			'name': generateUserName(groupId, relation.userId),
			'color': memberColor_promise
      });
	}).then(res.json.bind(res));
};

/* @desc: Gets group editor information, necessary information are:
 *        - groupId, topicId, docId (can be found in pad)
 *        - level, name, nextDeadline (can be found in topic)
 *        - chatRoomId (can be found in group)
 *        - isLastGroup
 *        - members (includes: color, name, userId, ratingIntegration, ratingKnowledge)
 */
exports.query = function(req, res) {
	const groupId = ObjectId(req.params.id);
	const userId = ObjectId(req.user._id);
	
	// Get docId, groupId and topicId from group pad
	const pad_promise = db.collection('pads_group').findOneAsync({'groupId': groupId});
	
	// Everything else depends on pad
	pad_promise.then(function(pad) {
		// Define some variables for simpler and more intuitie use
		const topicId = pad.topicId;
		
		/*
		 * Simple stuff
		 */
		
		// Get topic name
		const topic_promise = db.collection('topics').findOneAsync({'_id': topicId}, {'name': true});
		
		// Get chatRoomId from group
		const group_promise = db.collection('groups').findOneAsync({'_id': pad.groupId});
		
		// Count number of groups in current level to obtain if we are in last group (last level)
		const isLastGroup_promise = group_promise.then(function(currentGroup) {
			return db.collection('groups').countAsync({ 'topicId': currentGroup.topicId, 'level': currentGroup.level })
				.then(function(numGroupsInCurrentLevel) {
					return (numGroupsInCurrentLevel == 1) ? true : false;
			});
		});
		
		/*
		 * Group Members
		 */
		
		// Get group members
		const groupRelations_promise = getGroupMembersAsync(groupId);
		
		// Get number of group members
		const num_group_members_promise = groupRelations_promise.then(function(group_members) {
			return _.size(group_members);
		});
		
		// Generate group specific color_offset
		const chanceOffset = new Chance(groupId.toString());
		const offset = chanceOffset.integer({min: 0, max: 360});
		
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
		
		// Get group members
		const groupMembersDetails_promise = groupRelations_promise.map(function(relation, index) {
			
			// Generate member color
			const memberColor_promise = num_group_members_promise.then(function(numMembers) {
				const hue = offset + index*(360/numMembers);
				return Promise.resolve(Color({h: hue, s: 20, v: 100}).hex());
			});
         
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
			
			// Get member rating
			const memberRatingKnowledge_promise = ratings.getMemberRatingAsync(relation.userId, groupId, userId, C.RATING_KNOWLEDGE);
			const memberRatingIntegration_promise = ratings.getMemberRatingAsync(relation.userId, groupId, userId, C.RATING_INTEGRATION);
         
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
		const lastActivity_promise = db.collection('group_relations')
			.updateAsync({ 'grouId': groupId, 'userId': userId }, { $set: {'lastActivity': Date.now()} });
		
		// Collect all information and return
		return Promise.join(topic_promise, group_promise, isLastGroup_promise, groupMembersDetails_promise, lastActivity_promise)
			.spread(function(topic, group, isLastGroup, group_members) {
				return {
					'groupId': groupId,
					'name': group.name,
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
