var _ = require('underscore');
var db = require('../database').db;
var ObjectId = require('mongodb').ObjectID;
var Promise = require('bluebird');
//var requirejs = require('requirejs');
var fs = Promise.promisifyAll(require('fs'));
var path = require('path');
var appRoot = require('app-root-path');
var AsyncLock = require('async-lock');
var lock = new AsyncLock();

var C = require('../../shared/constants').C;
//var cfg = requirejs('public/js/setup/configs');
var cfg = require('../../shared/config').cfg;
var groups = require('./groups');
var pads = require('./pads');
var utils = require('../utils');
var mail = require('../mail');

function calculateDeadline(nextStage, prevDeadline, levelDuration) {
    // define standard parameter
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
    
    return groups.remixGroupsAsync(topic).then(function(result) {
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
            var tid = topic._id;
            
            // get the pad id of final document
            // e.g. the proposal pad id of the group in the last level
            var finalDocumentPadIdPromise = db.collection('groups').
                findOneAsync({'tid': tid, 'level': topic.level},{'ppid': true}).
                get('ppid').then(function (ppid) {
                    return db.collection('topic_proposals').
                        findOneAsync({'_id': ppid},{'pid': true});
                }).get('pid');
            
            // get pad pdf and save it
            finalDocumentPadIdPromise.then(pads.getPadPDFAsync).then(function(data) {
                var filename = path.join(appRoot.path, 'files/documents', tid+'.pdf');
                return fs.writeFileAsync(filename,data);
            });
            
            // updates below are only required if consensus stage is over
            update_set_promise = {
                'stage': (topic.stage = C.STAGE_PASSED),
                'nextDeadline': (topic.nextDeadline = calculateDeadline(C.STAGE_PASSED,prevDeadline)),
                'stagePassedStarted': Date.now(),
                'finalDocument': finalDocumentPadIdPromise.then(pads.getPadHTMLAsync)
            };
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
                return(_.extend(topic,update_set));
        });
    });
}
exports.manageConsensusStage = manageConsensusStageAsync;

/**
 * checks if a minimum of MIN_VOTES_PER_TOPIC proposal exists
 */
function isAccepted(topic) {
    return db.collection('topic_votes').
        countAsync({'tid': topic._id}).
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
    
    // exit this function if stage transition is not due yet
    if(Date.now() < topic.nextDeadline)
        return Promise.resolve(topic);
    
    // move to next stage
    var prevDeadline = topic.nextDeadline;
    switch (topic.stage) {
        case C.STAGE_SELECTION: // we are currently in selection stage
            return isAccepted(topic).then(function(isAccepted) {
                var stageStartedEntryName;
                if(isAccepted) {
                    // topic does meet the minimum requirements for the next stage
                    // move to next stage
                    topic.stage = C.STAGE_PROPOSAL;
                    topic.nextDeadline = calculateDeadline(C.STAGE_PROPOSAL,prevDeadline); // get deadline for proposal stage
                    stageStartedEntryName = 'stageProposalStarted';
                    topic[stageStartedEntryName] = Date.now();
                } else {
                    // topic has been rejected
                    // move to rejection stage
                    topic.stage = C.STAGE_REJECTED;
                    topic.rejectedReason = 'REJECTED_NOT_ENOUGH_VOTES';
                    stageStartedEntryName = 'stageRejectedStarted';
                    topic[stageStartedEntryName] = Date.now();
                }
                var updateTopicStatePromise =
                    updateTopicStateAsync(topic,stageStartedEntryName);
                var updatePadExpirationPromise =
                    pads.updatePadExpirationAsync(topic.pid, Date.now());
                
                return Promise.join(updateTopicStatePromise, updatePadExpirationPromise).
                       return(topic);
            });
        case C.STAGE_PROPOSAL: // we are currently in proposal stage
            // Set the next deadline here, so we can use it in createGroupsAsync.
            topic.nextDeadline = calculateDeadline(C.STAGE_CONSENSUS,prevDeadline);
            
            return groups.createGroupsAsync(topic).then(function(groups) {
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
                return Promise.join(topic,stageStartedEntryName);
            }).spread(function(topic, stageStartedEntryName) {
                return updateTopicStateAsync(topic, stageStartedEntryName).
                       return(topic);
            });
        case C.STAGE_CONSENSUS: // we are currently in consensus stage
            return manageConsensusStageAsync(topic);
    }
    
    return Promise.resolve(topic);
}

function appendTopicInfoAsync(topic, uid, with_details) {
	var tid = topic._id;
	
	// get number of participants and votes in this topic
	var topic_votes_promise = db.collection('topic_votes')
		.find({'tid': tid}, {'uid': true}).toArrayAsync();
	var topic_proposals_promise = db.collection('topic_proposals')
		.find({'tid': tid}).toArrayAsync();
    
	// TODO http://stackoverflow.com/questions/5681851/mongodb-combine-data-from-multiple-collections-into-one-how
	
	// Get groups and sort by level
	var groups_promise = db.collection('groups').find({ 'tid': tid })
		.sort({ 'level': -1 }).toArrayAsync();
	
	// Number of participants per level
	var participants_per_levels_promise = groups_promise.then(function(groups) {
		var member_counts_per_groups_promise =
		db.collection('group_members').aggregateAsync( [
			{ $match: { 'gid': { $in: _.pluck(groups, '_id') } } },
			{ $group: { '_id': '$gid', member_count: { $sum : 1 } } } ] );
		
		return Promise.join(groups, member_counts_per_groups_promise);
	}).spread(function (groups, member_counts_per_groups) {
		var member_counts_per_groups_sorted_by_levels =
		_.groupBy(member_counts_per_groups, function(member_count) {
			var groups_with_string_ids = _.map(groups, function(group) {
				group._id = group._id.toString();
				return group;
			});
			var gid_as_string = member_count._id.toString();
			// NOTE: findWhere does not work with ObjectIds
			var group = _.findWhere(groups_with_string_ids, {'_id': gid_as_string});
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
	var user_proposal_promise = null;
	var user_proposal_pad_html_promise = null;
	var description_promise = null;
	var description_pad_html_promise = null;
	var group_members_promise = null;
	var user_group_id_promise = null;
	var user_group_pad_id_promise = null;
	var user_group_pad_html_promise = null;
    
	if(with_details) {
		// Get user proposal id
		user_proposal_promise = db.collection('topic_proposals').findOneAsync({ 'tid': tid, 'source': uid });
		
		// Get user proposal html
		user_proposal_pad_html_promise = user_proposal_promise.then(function(topic_proposal) {
			if (_.isNull(topic_proposal))
				return "";
			return db.collection('pads').findOneAsync({ '_id': topic_proposal.pid }).then(function(pad) {
				return pad.html || "";
			});
		});
		
		// Get topic description id
		description_promise = db.collection('topic_descriptions').findOneAsync({ 'tid': topic._id });
		
		// Get pad description html
		description_pad_html_promise = description_promise.then(function(topic_description) {
			return db.collection('pads').findOneAsync({ '_id': topic_description.pid }).then(function(pad) {
				return pad.html || "";
			});
		});
		
		// Get group member uid's
		group_members_promise = groups_promise.then(function(groups) {
			return db.collection('group_members')
				.find({'gid': { $in: _.pluck(groups, '_id') } }).toArrayAsync();
		});
		
		// Find the group id that the current user is part of (in last level)
		user_group_id_promise = groups_promise.then(function(groups) {
			var highest_level = _.max(groups, function(group) {return group.level;}).level;
			var highest_level_groups = _.filter(groups, function(group) {return group.level == highest_level;});
			
			return db.collection('group_members')
				.findOneAsync({'gid': { $in: _.pluck(highest_level_groups, '_id') }, 'uid': uid}, {'gid': true});
		}).then(function(group_member) {
			return group_member ? group_member.gid : null;
		});
		
		// Find proposal id of user group
		user_group_pad_id_promise = user_group_id_promise.then(function(gid) {
			if (_.isNull(gid))
				return null;
			else
				return db.collection('topic_proposals').findOneAsync({ 'source': gid }, { 'pid': true });
		});
		
		// Get html of user group
		user_group_pad_html_promise = user_group_pad_id_promise.then(function(topic_proposal) {
			if (_.isNull(topic_proposal))
				return "";
			return db.collection('pads').findOneAsync({ '_id': topic_proposal.pid }).then(function(pad) {
				return pad.html || "";
			});
		});
	}
    
	// Delete pad id if user is not owner, pid is removed from response
	if(!_.isEqual(topic.owner, uid))
		delete topic.dpid;
	
	// Basic topic details
	var topic_without_details_promise = Promise.props(_.extend(topic,{
		'num_votes': topic_votes_promise.then(_.size),
		'num_proposals': topic_proposals_promise.then(_.size),
		'voted': topic_votes_promise.then(function(topic_votes) {
		return utils.checkArrayEntryExists(topic_votes, {'uid': uid});}),
		'levels': levels_promise
	}));
    
	// TODO Check if this is really a good way doing it
	
	if(with_details) {
		// Extended topic information for topic view
		return topic_without_details_promise.then(function(topic_without_details) {
			return Promise.props(_.extend(topic_without_details,{
				'groups': with_details ? groups_promise : null,
				'proposals': with_details ? topic_proposals_promise : null,
				
				// detailed
				'ppid': user_proposal_promise.then(function(proposal) {
					return _.isNull(proposal) ? null : proposal._id }),
				'proposal_html': user_proposal_pad_html_promise,
				'dpid': description_promise.get('_id'),
				'description_html': description_pad_html_promise,
				'group_members': group_members_promise,
				'gid': user_group_id_promise,
				'gpid': user_group_pad_id_promise.then(function(proposal) {
					return _.isNull(proposal) ? null : proposal._id	}),
				'group_html': user_group_pad_html_promise
			}));
		});
	} else {
		// Basic topic information for topic list
		return topic_without_details_promise;
	}
}

exports.list = function(req, res) {
    var uid = ObjectId(req.user._id);
    
    manageAndListTopicsAsync().then(function(topics) {
        // Promise.map does not work above
        Promise.map(topics, _.partial(appendTopicInfoAsync, _, uid, false))
        .then(function(topics){
           return topics;
        })
        .then(res.json.bind(res));
    });
};

exports.update = function(req, res) {
    var tid = ObjectId(req.params.id);
    var uid = ObjectId(req.user._id);
    var topicNew = req.body;
    
    db.collection('topics').findOneAsync({ '_id': tid }).then(function(topic) {
        // only the owner can update the topic
        if(!topic)
            return utils.rejectPromiseWithAlert(404, 'danger', 'TOPIC_NOT_FOUND');
        else if(!_.isEqual(topic.owner,uid))
            return utils.rejectPromiseWithAlert(403, 'danger', 'TOPIC_NOT_AUTHORISIZED_FOR_UPDATE');
        else if(topic.stage != C.STAGE_SELECTION)
            return utils.rejectPromiseWithAlert(403, 'danger', 'TOPIC_UPDATE_ONLY_IN_SELECTION_STAGE');
        
        return topic;
    }).then(function(topic) {
        topic.name = topicNew.name;
        return db.collection('topics').updateAsync(
                { '_id': tid }, { $set: _.pick(topic,'name') }, {}).return(topic);
    }).then(manageTopicStateAsync)
      .then(_.partial(appendTopicInfoAsync, _, uid, true))
      .then(res.json.bind(res))
      .catch(utils.isOwnError, utils.handleOwnError(res));
};

function updateTopicStateAsync(topic,stageStartedEntryName) {
    return db.collection('topics').updateAsync(
        _.pick(topic, '_id'),
        { $set: _.pick(topic, 'stage', 'nextDeadline', 'rejectedReason', stageStartedEntryName) },
        {});
}

exports.query = function(req, res) {
   var tid = ObjectId(req.params.id);
   var uid = ObjectId(req.user._id);
   
   db.collection('topics').findOneAsync({ '_id': tid })
      .then(manageTopicStateAsync)
      .then(function(topic) {
         if(_.isNull(topic))
            return utils.rejectPromiseWithAlert(404, 'danger', 'TOPIC_NOT_FOUND');
         else
            return appendTopicInfoAsync(topic, uid, true);
      }).then(res.json.bind(res))
      .catch(utils.isOwnError, utils.handleOwnError(res));
};

exports.create = function(req, res) {
    
   // Topic name is the only necessary request variable
   var data = req.body;
   var topic = {};
   topic.name = data.name;
   
   // reject empty topic names
   if(_.isEmpty(topic.name)) {
      utils.sendAlert(res, 400, 'danger', 'TOPIC_NAME_EMPTY');
      return;
   }
   
   // Only allow new topics if they do not exist yet
   db.collection('topics').countAsync({'name': topic.name}).then(function(count) {
      // Topic already exists
      if(count > 0)
         return utils.rejectPromiseWithAlert(409, 'danger', 'TOPIC_NAME_ALREADY_EXISTS');
      
      // Create topic
      topic._id = ObjectId();
      topic.owner = ObjectId(req.user._id);
      topic.stage = C.STAGE_SELECTION; // start in selection stage
      topic.level = 0;
      topic.nextDeadline = calculateDeadline(topic.stage);
      var createTopicPromise = db.collection('topics').insertAsync(topic);
      
      // Create description
      var dpid = ObjectId(); // Create random pad id
      var description = { 'pid': dpid, 'tid': topic._id };
      var createTopicDescriptionPromise = db.collection('topic_descriptions').insertAsync(description);
      
      // create pad
      var pad = { '_id': dpid, 'expiration': topic.nextDeadline };
      var createPadPromise = pads.createPadAsync(pad);
      
      return Promise.join(createTopicPromise, createTopicDescriptionPromise, createPadPromise).return(topic);
   }).then(function(topic) {
      topic.votes = 0;
      res.json(topic);
   }).catch(utils.isOwnError,utils.handleOwnError(res));
};

exports.delete = function(req,res) {
    var tid = ObjectId(req.params.id);
    var uid = ObjectId(req.user._id);
    
    db.collection('topics').findOneAsync({ '_id': tid }, { 'owner': true, 'stage': true }).
    then(function(topic) {
        // only the owner can delete the topic
        // and if the selection stage has passed, nobody can
        if(!_.isEqual(topic.owner,uid) || topic.stage > C.STAGE_SELECTION)
            return utils.rejectPromiseWithAlert(401, 'danger', 'TOPIC_NOT_AUTHORISIZED_FOR_DELETION');
        
        return Promise.join(
            db.collection('topics').removeByIdAsync(tid),
            db.collection('topic_votes').removeAsync({'tid': tid}),
            db.collection('groups').removeAsync({'tid': tid}));
    }).then(res.sendStatus.bind(res,200))
      .catch(utils.isOwnError,utils.handleOwnError(res));
};

function countVotes(tid) {
    return db.collection('topic_votes').countAsync( {'tid': tid} );
}

exports.vote = function(req, res) {
	// Transmitted topic vote
	var topic_vote = {
		'tid': ObjectId(req.body.tid),
		'uid': ObjectId(req.body.uid)
	};
	
	// Update the particular topic vote
	// If it already exists: Just update to the same (= do nothing)
	// If it does'nt exist: Insert
	db.collection('topic_votes')
		.updateAsync(topic_vote, topic_vote, {'upsert': true})
		.then(function(update_result) { return { 'voted': true }; })
		.then(res.json.bind(res));
};

exports.unvote = function(req, res) {
	// Trasmitted topic vote
    var topic_vote = {
		'tid': ObjectId(req.body.tid),
		'uid': ObjectId(req.body.uid)
	};
    
    // Remove vote from database
    db.collection('topic_votes').removeAsync(topic_vote)
    	.then(function(remove_result) { return { 'voted': false }; })
		.then(res.json.bind(res));
};

exports.final = function(req, res) {
    var tid = req.params.id;
    var filename = path.join(appRoot.path,'files/documents',tid+'.pdf');
    res.sendFile(filename);
};
