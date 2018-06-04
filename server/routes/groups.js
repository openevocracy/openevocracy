var _ = require('underscore');
var db = require('../database').db;
var ObjectId = require('mongodb').ObjectID;
var Promise = require('bluebird');
var Chance = require('chance');
var Color = require('color');
//var requirejs = require('requirejs');

var C = require('../../shared/constants').C;
//var cfg = requirejs('public/js/setup/configs');
var cfg = require('../../shared/config').cfg;
var ratings = require('./ratings');
var topics = require('./topics');
var pads = require('./pads');
var mail = require('../mail');
var utils = require('../utils');

function getGroupMembersAsync(groupId) {
	return db.collection('group_members').find({'groupId': groupId}, {'userId': true}).toArrayAsync();
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
 * @desc: Store group, group pad and members in database
 * @params:
 *    groupId: id of the new group
 *    topicId: id of the related topic
 *    padId: id of the related pad
 *    nextDeadline: deadline of the next stage (not the old one)
 *    level: new level (old level +1)
 *    members: array of group members (user id's)
 */
function storeGroupAsync(groupId, topicId, padId, nextDeadline, level, members) {
	// Create group itself
	var chatRoomId = ObjectId();
	var create_group_promise =
	db.collection('groups').insertAsync({
		'_id': groupId, 'topicId': topicId, 'chatRoomId': chatRoomId, 'level': level
	});
	
	// Create group pad
	var pad = { '_id': padId, 'topicId': topicId, 'groupId': groupId, 'expiration': nextDeadline };
	var create_pad_proposal_promise = pads.createPadAsync(pad, 'group');
	
	// Insert group members to database
	var insert_members_promise =
	db.collection('group_members').insertAsync(
		_.map(members, function(userId) {
			return { 'groupId': groupId, 'userId': userId, 'lastActivity': -1 };
		})
	);
	
	return Promise.join(create_pad_proposal_promise, create_group_promise, insert_members_promise);
}

function isProposalValid(html) {
	var num_words = html.replace(/<\/?[^>]+(>|$)/g, "").split(/\s+\b/).length;
	return num_words >= cfg.MIN_WORDS_PROPOSAL;
}

/**
 * @desc: initial creation of groups after proposal stage
 *        - check if user proposals are valid (filter participants)
 *        - randomly assign participants to groups
 */
exports.createGroupsAsync = function(topic) {
	var topicId = topic._id;
	
	var valid_participants_promise = db.collection('pads_proposal')
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
	
	var storeValidParticipantsPromise = valid_participants_promise.then(function(valid_participants) {
		console.log(valid_participants);
		return db.collection('topics').updateAsync(
		{ '_id': topic._id },
		{ $set: { 'valid_participants': _.size(valid_participants) } });
	});
	
	// Create group and notify members
	var createGroupsPromise = valid_participants_promise.then(function(valid_participants) {
		return assignParticipantsToGroups(valid_participants);
	}).map(function(group_members) {
		// Create new group id
		var groupId = ObjectId();
		
		// TODO Notifications
		// Send mail to notify new group members
		var send_mail_promise = db.collection('users')
			.find({'_id': { $in: group_members }}, {'email': true}).toArrayAsync()
			.then(function(users) {
				mail.sendMailMulti(users,
					'EMAIL_CONSENSUS_START_SUBJECT', [topic.name],
					'EMAIL_CONSENSUS_START_MESSAGE', [topic.name, groupId.toString(), cfg.BASE_URL]);
		});
		
		// Store group in database
		var topicId = topic._id;
		var padId = ObjectId();
		var nextDeadline = topic.nextDeadline;
		var store_group_promise = storeGroupAsync(groupId, topicId, padId, nextDeadline, 0, group_members);
		
		// Append group id to proposal so we can identify it later
		var update_source_proposals_promise = db.collection('topic_proposals')
			.updateAsync(
				{ 'topicId': topicId, 'ownerId': { $in: group_members } },
				{ $set: { 'nextPadId': padId } }, {'upsert': false, 'multi': true}
		);
		
		// Join promises and return group members
		return Promise
			.join(send_mail_promise, store_group_promise, update_source_proposals_promise)
			.return(group_members);
	});
    
	return Promise.join(createGroupsPromise, storeValidParticipantsPromise).get(0);
};

function getGroupsOfSpecificLevelAsync(topicId, level) {
    return db.collection('groups').find({ 'tid': topicId, 'level': level }).toArrayAsync();
}
exports.getGroupsOfSpecificLevelAsync = getGroupsOfSpecificLevelAsync;

function getValidGroupsOfSpecificLevelAsync(tid, level) {
    return getGroupsOfSpecificLevelAsync(tid, level).filter(function (group) {
        return db.collection('topic_proposals').findOneAsync({'source': group._id}).
        then(function(proposal) {
            // Get HTML from document
            proposal.body = pads.getPadHTMLAsync('proposal', proposal.pid);
            return Promise.props(proposal);
        }).then(function(proposal) {
            // Check if proposal is valid
            return isProposalValid(proposal);
        });
    }).then(function (groups) {
        // If no valid proposal exists: reject, otherwise return all valid groups
        if(_.isEmpty(groups))
            return Promise.reject({reason: 'REJECTED_NO_VALID_GROUP_PROPOSAL'});
        else
            return Promise.resolve(groups);
    });
}

/**
 * @desc: create of groups after level is finished
 *        - check if group proposals are valid (filter groups)
 *        - find group leader (with highest rating)
 *        - randomly assign participants to new groups
 */
exports.remixGroupsAsync = function(topic) {
    var tid = topic._id;
    
    // Get groups with highest level
    var groupsPromise = getValidGroupsOfSpecificLevelAsync(tid, topic.level);
    
    // Get group leaders
    var leadersPromise = groupsPromise.map(function(group_in) {
        var gid = group_in._id;
        
        return ratings.getGroupLeaderAsync(gid).then(function(leader) {
            if(!_.isUndefined(leader))
                return Promise.resolve(leader);
            
            // if group leader is undefined, pick one randomly
            return getGroupMembersAsync(gid).then(function(members) {
                return Promise.resolve(_.sample(members).uid);
            });
        });
    });
    
    return Promise.join(groupsPromise, leadersPromise).spread(function(groups, leaders) {
        // If there is only ONE group in the current topic level,
        // then the topic is finished/passed.
        if(1 == _.size(groups)) {
            // Send mail to notifiy about finished topic and return next stage.
            return db.collection('groups').find({ 'tid': topic._id, 'level': 0 }).
                toArrayAsync().then(function(groups) {
                    return db.collection('group_members').find({'gid': { $in: _.pluck(groups, '_id') }}, {'uid': true}).
                        toArrayAsync();
                }).then(function(participants) {
                    return db.collection('users').find({'_id': { $in: _.pluck(participants, 'uid') }}, {'email': true}).
                        toArrayAsync().then(function(users) {
                            mail.sendMailMulti(users,
                                'EMAIL_TOPIC_PASSED_SUBJECT', [topic.name],
                                'EMAIL_TOPIC_PASSED_MESSAGE', [topic.name, topic._id, cfg.BASE_URL]);
                        });
                }).return({'nextStage': C.STAGE_PASSED});
        }
        
        // assign members to groups
        var groups_members = assignParticipantsToGroups(leaders);
        
        // insert all groups into database
        var nextLevel = topic.level+1;
        return Promise.map(groups_members, function(group_members) {
            // create group new id
            var gid = ObjectId();
            
            // store group in database
            var tid = topic._id;
            var padId = ObjectId();
            var prevDeadline = topic.nextDeadline;
            var nextDeadline = topics.calculateDeadline(C.STAGE_CONSENSUS,prevDeadline);
            var store_group_promise = storeGroupAsync(gid, tid, padId, nextDeadline, nextLevel, group_members);
            
            // send mail to notify level change
            var send_mail_promise =
            db.collection('users').find({'_id': { $in: group_members }},{'email': true}).
            toArrayAsync().then(function(users) {
                mail.sendMailMulti(users,
                    'EMAIL_LEVEL_CHANGE_SUBJECT', [topic.name],
                    'EMAIL_LEVEL_CHANGE_MESSAGE', [topic.name, gid.toString(), cfg.BASE_URL]);
            });
            
            // register as sink for source proposals
            // find previous gids corresponding uids in group_out (current group)
            var update_source_proposals_promise =
            db.collection('group_members').find({'uid': { $in: group_members }}).
            toArrayAsync().then(function(members) {
                var gids = _.pluck(members,'gid');
                
                // filter out only previous level proposals
                var prevLevel = topic.level;
                return db.collection('groups').find(
                    {'_id': { $in: gids }, 'level': prevLevel}, {'_id': true}).
                    toArrayAsync();
            }).then(function(source_groups) {
                var sources = _.pluck(source_groups,'_id');
                
                // update sink of previous proposals
                return db.collection('topic_proposals').updateAsync(
                    { 'tid': tid, 'source': { $in: sources } },
                    { $set: { 'sink': gid } }, {'upsert': false, 'multi': true});
            });
            
            return Promise.join(
                send_mail_promise,
                store_group_promise,
                update_source_proposals_promise);
        }).return({'nextStage': C.STAGE_CONSENSUS}); // we stay in consensus stage
    }).catch(utils.isOwnError,function(error) {
        return {
            'nextStage': C.STAGE_REJECTED,
            'rejectedReason': error.reason
        };
    });
};

exports.list = function(req, res) {
    db.collection('groups').find().toArrayAsync().then(_.bind(res.json,res));
};

function getProposalBodyAsync(mid, gid, proposals_source_promise) {
    // mid: member id, gid: group id
    return db.collection('topic_proposals').findOneAsync(
        {'source': mid, 'sink': gid},{'pid': true}).then(function(proposal) {
        
        // Proposal was found
        // This means it was a user-created proposal
        if(!_.isNull(proposal))
            return Promise.resolve(proposal);
        
        // Proposal was not found: We have a group proposal
        // Find group where user was member in level before
        // and get proposal from that group
        return proposals_source_promise.then(function(proposals) {
            return db.collection('group_members').
                findOneAsync({'gid': {$in: _.pluck(proposals, 'source')}, 'uid': mid },{'gid': true}).
                then(function(group_member) {
                    return utils.findWhereObjectId(proposals, {'source': group_member.gid});
                });
        });
    }).then(function(proposal) {
        return pads.getPadHTMLAsync('proposal', proposal.pid);
    });
}

function getMemberRatingAsync(ruid, gid, uid, type) {
    return db.collection('ratings').findOneAsync(
        {'ruid': ruid, 'gid': gid, 'uid': uid, 'type': type},{'score': true}).
    then(function(rating) {
        return rating ? rating.score : 0;
    });
}

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
	var pad_promise = db.collection('pads_group')
		.findOneAsync({'_id': padId}, { 'docId': true, 'groupId': true, 'topicId': true });
	
	// Everything else depends on pad
	var all_promise = pad_promise.then(function(pad) {
		// Define some variables for simpler and more intuitie use
		var groupId = pad.groupId;
		var topicId = pad.topicId;
		
		/*
		 * Simple stuff
		 */
		
		// Get level, name and nextDeadline
		var topic_promise = db.collection('topics')
			.findOneAsync({'_id': topicId}, { 'level': true, 'name': true, 'nextDeadline': true });
		
		// Get chatRoomId from group
		var group_promise = db.collection('groups')
			.findOneAsync({'_id': pad.groupId}, {'chatRoomId': true});
		
		// Count number of groups in current level to obtain if we are in last group (last level)
		var isLastGroup_promise = topic_promise.then(function(topic) {
			return db.collection('groups').countAsync({ 'topicId': topic._id, 'level': topic.level })
				.then(function(numGroupsInCurrentLevel) {
					return (numGroupsInCurrentLevel == 1) ? true : false;
			});
		});
		
		// TODO Get all source proposals
		/*var proposals_source_promise = group_promise.then(function(group) {
			return db.collection('topic_proposals').find({'sink': gid, 'tid': group.tid},
				{'source': true, 'pid': true}).toArrayAsync();
		});*/
		
		/*
		 * Group Members
		 */
		
		// Get group members
		var group_members_promise = getGroupMembersAsync(groupId);
		
		// Get number of group members
		var num_group_members_promise = group_members_promise.then(function(group_members) {
			return _.size(group_members);
		});
		
		// Generate group specific color_offset
		var chance = new Chance(groupId.toString());
		var offset = chance.integer({min: 0, max: 360});
		
		// Get group members
		var group_members_details_promise = group_members_promise.map(function(member, index) {
			
			// Generate member color
			var member_color_promise = num_group_members_promise.then(function(numMembers) {
				var hue = offset + index*(360/numMembers);
				return Promise.resolve(Color({h: hue, s: 20, v: 100}).hex());
			});
         
         // TODO Get proposal html
			//var member_proposal_html_promise = getProposalBodyAsync(member.userId, groupId, proposals_source_promise);
			
			// Get member rating
			var member_rating_knowledge_promise = getMemberRatingAsync(member.userId, groupId, userId, C.RATING_KNOWLEDGE);
			var member_rating_integration_promise = getMemberRatingAsync(member.userId, groupId, userId, C.RATING_INTEGRATION);
         
         return Promise.props({
         	'userId': member.userId,
				'name': chance.first(),
				'color': member_color_promise,
				/*'proposal_html': member_proposal_html_promise,*/
				'ratingKnowledge': member_rating_knowledge_promise,
				'ratingIntegration': member_rating_integration_promise
         });
		});
		
		// Finally, set lastActivity for the member querying the group
		var lastActivity_promise = db.collection('group_members')
			.updateAsync({ 'grouId': groupId, 'userId': userId }, { $set: {'lastActivity': Date.now()} });
		
		// Collect all information and return
		return Promise.join(topic_promise, group_promise, isLastGroup_promise, group_members_details_promise, lastActivity_promise)
			.spread(function(topic, group, isLastGroup, group_members) {
				return {
					'groupId': groupId,
					'topicId': topicId,
					'docId': pad.docId,
					'level': topic.level,
					'title': topic.name,
					'nextDeadline': topic.nextDeadline,
					'chatRoomId': group.chatRoomId,
					'isLastGroup': isLastGroup,
					'members': group_members
				};
		});
	}).then(res.json.bind(res));
};
