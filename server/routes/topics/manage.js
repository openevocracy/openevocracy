// General libraries
const _ = require('underscore');
const ObjectId = require('mongodb').ObjectID;
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const path = require('path');
const appRoot = require('app-root-path');
const AsyncLock = require('async-lock');
const lock = new AsyncLock();

// Own references
const C = require('../../../shared/constants').C;
const cfg = require('../../../shared/config').cfg;
const db = require('../../database').db;
const utils = require('../../utils');
const groups = require('../groups');
const pads = require('../pads');
const activities = require('../activities');

function calculateDeadline(nextStage, prevDeadline, levelDuration) {
    // Define standard parameter
    if(_.isUndefined(levelDuration))
        levelDuration = cfg.DURATION_LEVEL;
    
    var nextDeadline = _.isUndefined(prevDeadline) ? Date.now() : prevDeadline;
    //var nextDeadline = Date.now();
    switch (nextStage) {
        case C.STAGE_SELECTION: // get selection stage deadline
            nextDeadline += cfg.DURATION_SELECTION;
            break;
        case C.STAGE_PROPOSAL: // get proposal stage deadline
            nextDeadline += cfg.DURATION_PROPOSAL;
            break;
        case C.STAGE_CONSENSUS: // get consensus stage deadline
            nextDeadline += levelDuration;
            break;
        case C.STAGE_PASSED:
        case C.STAGE_REJECTED:
            nextDeadline = cfg.DURATION_NONE;
            break;
    }
    
    return nextDeadline;
}
exports.calculateDeadline = calculateDeadline;

function manageConsensusStageAsync(topic, levelDuration) {
    // levelDuration is an optional parameter
    // it will get a default value in calculateDeadline if not set (for testing purposes)
    var prevDeadline = topic.nextDeadline;
    
    return groups.manage.remixGroupsAsync(topic).then(function(result) {
        var update_set_promise;
        switch(result.nextStage) {
        case C.STAGE_CONSENSUS:
            // updates below are only required while we are in consensus stage
            update_set_promise = {
                'level': (++topic.level),
                'nextDeadline': (topic.nextDeadline = calculateDeadline(C.STAGE_CONSENSUS,prevDeadline,levelDuration))
            };
            break;
        case C.STAGE_PASSED:
				var topicId = topic._id;
				
				// get the pad id of final document
				// e.g. the proposal pad id of the group in the last level
				const finalDocumentHtml_promise = db.collection('groups')
					.findOneAsync({ 'topicId': topicId, 'level': topic.level },{'_id': true})
					.then(function(group) {
						return db.collection('pads_group').findOneAsync({'groupId': group._id},{'docId': true}).get('docId');
				    }).then(function(docId) {
				    	return pads.getPadHTMLAsync('group', docId);
				    });
            
            // Get pad PDF and save it in file system
            finalDocumentHtml_promise.then(pads.getPadPDFAsync).then(function(data) {
                var filename = path.join(appRoot.path, 'files/documents', topicId+'.pdf');
                return fs.writeFileAsync(filename,data);
            });
            
            // Updates below are only required if consensus stage is over
            update_set_promise = {
                'stage': (topic.stage = C.STAGE_PASSED),
                'nextDeadline': (topic.nextDeadline = calculateDeadline(C.STAGE_PASSED,prevDeadline)),
                'stagePassedStarted': Date.now(),
                'finalDocument': finalDocumentHtml_promise
            };
                        
            // Add activity for author
            const authorActivity_promise = activities.storeActivity(topic.owner, C.ACT_TOPIC_COMPLETE, topicId);
            
            // Add activities for interested persons (persons who voted for the respective topics)
				const interestedActivity_promise = db.collection('topic_votes')
					.find({'topicId': topicId}, {'userId': true}).toArrayAsync()
					.then(function(userVotes) {
							_.each(userVotes, function(el) {
									if (!utils.equalId(el.userId, topic.owner)) // if activity has not yet been added
										activities.storeActivity(el.userId, C.ACT_TOPIC_COMPLETE, topicId);
								});
						});
		
            break;
        case C.STAGE_REJECTED:
            // updates below are only required if topic was rejected
            update_set_promise = {
                'stage': (topic.stage = C.STAGE_REJECTED),
                'nextDeadline': (topic.nextDeadline = calculateDeadline(C.STAGE_REJECTED,prevDeadline)),
                'stageRejectedStarted': Date.now(),
                'rejectedReason': result.rejectedReason
            };
            break;
        default:
            return Promise.reject('unknown stage');
        }
        
        // update database
        return Promise.props(update_set_promise).then(function(update_set) {
            return db.collection('topics').updateAsync(
                _.pick(topic, '_id'), { $set: update_set }, {}).
                return(_.extend(topic, update_set));
        });
    });
}
exports.manageConsensusStage = manageConsensusStageAsync;

/**
 * checks if a minimum of MIN_VOTES_PER_TOPIC proposal exists
 */
function isAccepted(topic) {
    return db.collection('topic_votes').
        countAsync({'topicId': topic._id}).
        then(function(count) {return count >= cfg.MIN_VOTES_PER_TOPIC;});
}

/**
 * gets all topics from database, call management of topic states and retun all topics
 * 
 * @return {object} topics - all adjusted topics
 */
function manageAndListTopicsAsync() {
	return lock.acquire('manageTopic', function() {
		return db.collection('topics').find().toArrayAsync()
			.map(_.partial(manageTopicStateAsync));
	});
}
exports.manageAndListTopicsAsync = manageAndListTopicsAsync;

/**
 * managment of topic states/levels
 * if deadline of state/level is expired, change state/level in database
 * and return changed topic
 * 
 * @param {object} topic - a topic from database
 * @return {object} topic - adjusted topic
 */
function manageTopicStateAsync(topic) {
   
	// Exit this function if stage transition is not due yet
	if(Date.now() < topic.nextDeadline)
		return Promise.resolve(topic);
			
	// Move to next stage
	var prevDeadline = topic.nextDeadline;
	switch (topic.stage) {
		case C.STAGE_SELECTION: // we are currently in selection stage
			return isAccepted(topic).then(function(isAccepted) {
				var stageStartedEntryName;
				if(isAccepted) {
					// Topic does meet the minimum requirements for the next stage, move to next stage
					topic.stage = C.STAGE_PROPOSAL;
					topic.nextDeadline = calculateDeadline(C.STAGE_PROPOSAL,prevDeadline); // get deadline for proposal stage
					stageStartedEntryName = 'stageProposalStarted';
					topic[stageStartedEntryName] = Date.now();
				} else {
					// Topic has been rejected, move to rejection stage
					topic.stage = C.STAGE_REJECTED;
					topic.rejectedReason = 'REJECTED_NOT_ENOUGH_VOTES';
					stageStartedEntryName = 'stageRejectedStarted';
					topic[stageStartedEntryName] = Date.now();
				}
				var updateTopicStatePromise = updateTopicStateAsync(topic,stageStartedEntryName);
				var updatePadExpirationPromise = db.collection('pads_topic_description').updateAsync(
					{ '_id': topic.pid }, { $set: { 'expiration': Date.now() }}
				);
				
				return Promise.join(updateTopicStatePromise, updatePadExpirationPromise).
				return(topic);
			});
		case C.STAGE_PROPOSAL: // we are currently in proposal stage
			// Set the next deadline here, so we can use it in createGroupsAsync.
			topic.nextDeadline = calculateDeadline(C.STAGE_CONSENSUS,prevDeadline);
			
			return groups.manage.createGroupsAsync(topic).then(function(groups) {
				var stageStartedEntryName;
				
				if(_.size(groups) >= cfg.MIN_GROUPS_PER_TOPIC) {
					topic.stage = C.STAGE_CONSENSUS;
					stageStartedEntryName = 'stageConsensusStarted';
				} else {
					topic.stage = C.STAGE_REJECTED;
					topic.nextDeadline = cfg.DURATION_NONE;
					topic.rejectedReason = 'REJECTED_NOT_ENOUGH_VALID_USER_PROPOSALS';
					stageStartedEntryName = 'stageRejectedStarted';
				}
				
				topic[stageStartedEntryName] = Date.now();
				return Promise.join(topic, stageStartedEntryName);
			}).spread(function(topic, stageStartedEntryName) {
				return updateTopicStateAsync(topic, stageStartedEntryName).return(topic);
			});
		case C.STAGE_CONSENSUS: // we are currently in consensus stage
			return manageConsensusStageAsync(topic);
	}
	
	return Promise.resolve(topic);
}
exports.manageTopicStateAsync = manageTopicStateAsync;

function appendTopicInfoAsync(topic, userId, with_details) {
	var topicId = topic._id;
	
	// Get number of participants and votes in this topic
	var topic_votes_promise = db.collection('topic_votes')
		.find({'topicId': topicId}, {'userId': true}).toArrayAsync();
	var pads_proposal_count_promise = db.collection('pads_proposal').countAsync({'topicId': topicId});
    
	// TODO http://stackoverflow.com/questions/5681851/mongodb-combine-data-from-multiple-collections-into-one-how
	
	// Get groups and sort by level
	var groups_promise = db.collection('groups')
		.find({ 'topicId': topicId }, { 'level': true })
		.sort({ 'level': -1 }).toArrayAsync();
	
	// Number of participants per level
	var participants_per_levels_promise = groups_promise.then(function(groups) {
		var memberCountsPerGroups_promise =
		db.collection('group_relations').aggregateAsync( [
			{ $match: { 'groupId': { $in: _.pluck(groups, '_id') } } },
			{ $group: { '_id': '$groupId', member_count: { $sum : 1 } } } ] );
		
		return Promise.join(groups, memberCountsPerGroups_promise);
	}).spread(function (groups, member_counts_per_groups) {
		var member_counts_per_groups_sorted_by_levels =
		_.groupBy(member_counts_per_groups, function(member_count) {
			var group = utils.findWhereObjectId(groups, {'_id': member_count._id});
			return group.level;
		});
        
		var member_counts_per_levels =
		_.mapObject(member_counts_per_groups_sorted_by_levels,
		function(member_counts_per_groups, level) {
			var member_counts_per_level = _.reduce(member_counts_per_groups,
				function(memo, member_counts_per_group) {
					return memo + member_counts_per_group.member_count;
				}, 0);
				return member_counts_per_level;
		});
        
		return member_counts_per_levels;
	});
	
	// Number of groups per level
	var groups_per_levels_promise = groups_promise.then(function(groups) {
		if(_.isEmpty(groups))
			return null;
		
		// count groups by level
		return _.countBy(groups, function(group) {return group.level;});
	});
	
	// Combine #participants and #groups
	var levels_promise =
		Promise.join(participants_per_levels_promise, groups_per_levels_promise)
			.spread(function(participants_per_levels, groups_per_levels) {
				var levels_object = _.mapObject(participants_per_levels,function(participants_per_level, level) {
					return { 'participants': participants_per_level, 'groups': groups_per_levels[level] };
			});
		return _.toArray(levels_object);
	});
	
	// Detailed data (not used in topic list, only in details)
	var pad_description_promise = null;
	var user_proposal_promise = null;
	var user_group_promise = null;
    
	if(with_details) {
		// Get topic description
		pad_description_promise = db.collection('pads_topic_description')
			.findOneAsync({'topicId': topicId}, { 'docId': true, 'ownerId': true })
			.then(function(pad) {
				return pads.addHtmlToPadAsync('topic_description', pad);
		});
		
		// Get proposal of user
		user_proposal_promise = db.collection('pads_proposal')
			.findOneAsync({ 'topicId': topicId, 'ownerId': userId }, { 'docId': true, 'ownerId': true })
			.then(function(pad) {
				return _.isNull(pad) ? null : pads.addHtmlToPadAsync('proposal', pad);
		});
		
		// Find the group that the current user is part of (in last level)
		user_group_promise = groups_promise.then(function(groups) {
			if (_.isEmpty(groups))
				return null;
			
			return groups_promise.then(function(groups) {
				// Get all groups in highest level
				var highest_level = _.max(groups, function(group) {return group.level;}).level;
				var highest_level_groups = _.filter(groups, function(group) { return group.level == highest_level; });
				
				// Find that highest_level_groups, where user is part of and return that group
				var group_promise = db.collection('group_relations')
					.findOneAsync({'groupId': { $in: _.pluck(highest_level_groups, '_id') }, 'userId': userId})
					.then(function(member) {
						if (_.isNull(member))
							return null;
						return utils.findWhereObjectId(highest_level_groups, {'_id': member.groupId});
				});
				
				// Get group pad information
				var pad_promise = group_promise.then(function(group) {
					if (_.isNull(group))
						return null;
					return db.collection('pads_group').findOneAsync({'groupId': group._id}, {'docId': true});
				});
				
				return Promise.join(group_promise, pad_promise);
			}).spread(function(group, pad) {
				if (_.isNull(group)) {
					return null;
				} else {
					// Add pad id, doc id and html to group
					var groupAndPad = _.extend(group, { 'padId': pad._id, 'docId': pad.docId });
					return pads.addHtmlToPadAsync('group', groupAndPad);
				}
			});
		});
	}
	
	// Basic topic details
	var topic_without_details_promise = Promise.props(_.extend(topic,{
		'numVotes': topic_votes_promise.then(_.size),
		'numProposals': pads_proposal_count_promise,
		'voted': topic_votes_promise.then(function(topic_votes) {
			return utils.checkArrayEntryExists(topic_votes, {'userId': userId});
		}),
		'levels': levels_promise
	}));
    
	// TODO Check if this is really a good way doing it
	
	if(with_details) {
		// Extended topic information for topic view
		return topic_without_details_promise.then(function(topic_without_details) {
			return Promise.props(_.extend(topic_without_details, {
				'group': user_group_promise,
				'proposal': user_proposal_promise,
				'description': pad_description_promise
			}));
		});
	} else {
		// Basic topic information for topic list
		return topic_without_details_promise;
	}
}
exports.appendTopicInfoAsync = appendTopicInfoAsync;

function updateTopicStateAsync(topic,stageStartedEntryName) {
    return db.collection('topics').updateAsync(
        _.pick(topic, '_id'),
        { $set: _.pick(topic, 'stage', 'nextDeadline', 'rejectedReason', stageStartedEntryName) },
        {});
}

/*function countVotes(topicId) {
    return db.collection('topic_votes').countAsync( {'topicId': topicId} );
}*/
