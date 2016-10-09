var _ = require('underscore');
var db = require('../database').db;
var ObjectId = require('mongodb').ObjectID;
var Promise = require('bluebird');
var requirejs = require('requirejs');
var fs = Promise.promisifyAll(require('fs'));
var path = require('path');
var appRoot = require('app-root-path');

var C = requirejs('public/js/setup/constants');
var cfg = requirejs('public/js/setup/configs');
var groups = require('./groups');
var pads = require('../pads');
var utils = require('../utils');
var mail = require('../mail');

function getDeadline(nextStage, prevDeadline, levelDuration) {
    // define standard parameter
    if(_.isUndefined(levelDuration))
        levelDuration = cfg.DURATION_LEVEL;
    
    //var nextDeadline = prevDeadline || Date.now();
    var nextDeadline = Date.now();
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

function manageConsensusStage(topic, levelDuration) {
    return groups.remixGroupsAsync(topic).then(function(result) {
        var update_set_promise;
        switch(result.nextStage) {
        case C.STAGE_CONSENSUS:
            // updates below are only required while we are in consensus stage
            update_set_promise = {
                'level': (++topic.level),
                'nextDeadline': (topic.nextDeadline = getDeadline(C.STAGE_CONSENSUS,undefined,levelDuration))
            };
            break;
        case C.STAGE_PASSED:
            var tid = topic._id;
            
            // get the pad id of final document
            // e.g. the proposal pad id of the group in the last level
            var finalDocumentPadIdPromise = db.collection('groups').
                findOneAsync({'tid': tid, 'level': topic.level},{'ppid': true}).
                get('ppid');
            
            // get pad pdf and save it
            finalDocumentPadIdPromise.then(pads.getPadPDFAsync).then(function(data) {
                var filename = path.join(appRoot.path,'files/documents',tid+'.pdf');
                return fs.writeFileAsync(filename,data);
            });
            
            // updates below are only required if consensus stage is over
            update_set_promise = {
                'stage': (topic.stage = C.STAGE_PASSED),
                'nextDeadline': (topic.nextDeadline = getDeadline(C.STAGE_PASSED)),
                'stagePassedStarted': Date.now(),
                'finalDocument': finalDocumentPadIdPromise.then(pads.getPadHTMLAsync)
            };
            break;
        case C.STAGE_REJECTED:
            // updates below are only required if topic was rejected
            update_set_promise = {
                'stage': (topic.stage = C.STAGE_REJECTED),
                'nextDeadline': (topic.nextDeadline = getDeadline(C.STAGE_REJECTED)),
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
exports.manageConsensusStage = manageConsensusStage;

/*
checks if a minimum of MIN_PARTICIPANTS_PER_TOPIC proposal exists
*/
function isAccepted(topic) {
    return db.collection('topic_participants').
        countAsync({'tid': topic._id}).
        then(function(count) {return count >= cfg.MIN_PARTICIPANTS_PER_TOPIC;});
}

function manageTopicState(topic) {
    // exit this funtion if stage transition is not due yet
    if(Date.now() < topic.nextDeadline)
        return Promise.resolve(topic);
    
    // move to next stage
    var prevDeadline = topic.nextDeadline;
    switch (topic.stage) {
        case C.STAGE_SELECTION: // we are currently in selection stage
            return isAccepted(topic).then(function(isAccepted) {
                if(isAccepted) {
                    // topic does meet the minimum requirements for the next stage
                    // move to next stage
                    topic.stage = C.STAGE_PROPOSAL;
                    topic.nextDeadline = getDeadline(C.STAGE_PROPOSAL,prevDeadline); // get deadline for proposal stage
                    var stageStartedEntryName = 'stageProposalStarted';
                    topic[stageStartedEntryName] = Date.now();
                } else {
                    // topic has been rejected
                    // move to rejection stage
                    topic.stage = C.STAGE_REJECTED;
                    topic.rejectedReason = 'REJECTED_NOT_ENOUGH_VOTES';
                    var stageStartedEntryName = 'stageRejectedStarted';
                    topic[stageStartedEntryName] = Date.now();
                }
                
                return updateTopicState(topic,stageStartedEntryName).
                       return(topic);
            });
        case C.STAGE_PROPOSAL: // we are currently in proposal stage
            var stageStartedEntryName;
            return groups.createGroups(topic).then(function (groups) {
                if(_.size(groups) >= C.MIN_GROUPS_PER_TOPIC) {
                    topic.stage = C.STAGE_CONSENSUS;
                    topic.nextDeadline = getDeadline(C.STAGE_CONSENSUS,prevDeadline);
                    stageStartedEntryName = 'stageConsensusStarted';
                } else {
                    topic.stage = C.STAGE_REJECTED;
                    topic.rejectedReason = 'REJECTED_NOT_ENOUGH_VALID_USER_PROPOSALS';
                    stageStartedEntryName = 'stageRejectedStarted';
                }
                
                topic[stageStartedEntryName] = Date.now();
                return Promise.resolve();
            }).then(_.partial(updateTopicState,topic,stageStartedEntryName)).
                return(topic);
        case C.STAGE_CONSENSUS: // we are currently in consensus stage
            return manageConsensusStage(topic);
    }
    
    return Promise.resolve(topic);
}
exports.manageTopicState = manageTopicState;

// appends timeCreated and stageName
function appendBasicTopicInfo(topic) {
    // append timeCreated
    topic.timeCreated = topic._id.getTimestamp();
    
    // append stage name
    switch (topic.stage) {
        case C.STAGE_REJECTED:
            topic.stageName = "rejected";
            break;
        case C.STAGE_SELECTION:
            topic.stageName = "selection";
            break;
        case C.STAGE_PROPOSAL:
            topic.stageName = "proposal";
            break;
        case C.STAGE_CONSENSUS:
            topic.stageName = "consensus";
            break;
        case C.STAGE_PASSED:
            topic.stageName = "passed";
            break;
        default:
            topic.stageName = "unknown";
            break;
    }
    
    return topic;
}
exports.appendBasicTopicInfo = appendBasicTopicInfo;

function appendExtendedTopicInfoAsync(topic,uid,with_details) {
    var tid = topic._id;
    
    // get pad body if asked for
    var pad_body_promise = null;
    if(with_details)
        pad_body_promise = pads.getPadHTMLAsync(topic.pid);
    
    // get number of participants and votes in this topic
    var topic_votes_promise = db.collection('topic_votes').
        find({'tid': tid}, {'uid': true}).toArrayAsync();
    var topic_participants_promise = db.collection('topic_participants').
        find({'tid': tid}, {'uid': true}).toArrayAsync();
    
    // TODO http://stackoverflow.com/questions/5681851/mongodb-combine-data-from-multiple-collections-into-one-how
    
    // get groups and sort by level
    var groups_promise = db.collection('groups').find({ 'tid': tid }).
        sort({ 'level': -1 }).toArrayAsync();
    
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
    
    var groups_per_levels_promise = groups_promise.then(function(groups) {
        if(_.isEmpty(groups))
            return null;
            
        // count groups by level
        return _.countBy(groups, function(group) {return group.level;});
    });
    
    var levels_promise =
        Promise.join(participants_per_levels_promise, groups_per_levels_promise).
        spread(function(participants_per_levels, groups_per_levels) {
            var levels_object = _.mapObject(participants_per_levels,function(participants_per_level, level){
                return { 'participants': participants_per_level, 'groups': groups_per_levels[level] };
            });
            return _.toArray(levels_object);
        });
    
    
    // find the group that the current user is part of
    var find_user_group_promise = groups_promise.then(function(groups) {
        return db.collection('group_members').findOneAsync(
            {'gid': { $in: _.pluck(groups, '_id') }, 'uid': uid}, {'gid': true});
    }).then(function(group_member) {
        return group_member ? group_member.gid : null;
    });
    
    // delete pad id if user is not owner, pid is removed from response
    if(!_.isEqual(topic.owner,uid))
        delete topic.pid;
    
    return Promise.props(_.extend(topic,{
        'body': pad_body_promise,
        'votes': topic_votes_promise.then(_.size),
        'participants': topic_participants_promise.then(_.size),
        'voted': topic_votes_promise.then(function(topic_votes) {
            return utils.checkArrayEntryExists(topic_votes, {'uid': uid});}),
        'joined': topic_participants_promise.then(function(topic_participants) {
            return utils.checkArrayEntryExists(topic_participants, {'uid': uid});}),
        'levels': levels_promise,
        'gid': find_user_group_promise,
        'timeCreated': tid.getTimestamp()
    }));
}

function appendTopicInfoAsync(topic,uid,with_details) {
    appendBasicTopicInfo(topic);
    return appendExtendedTopicInfoAsync(topic,uid,with_details);
}

exports.list = function(req, res) {
    var uid = ObjectId(req.signedCookies.uid);
    
    db.collection('topics').find().toArrayAsync().map(function(topic) {
        return manageTopicState(topic).then(_.partial(appendTopicInfoAsync,_,uid,false));
    }).then(res.json.bind(res));
};

exports.update = function(req, res) {
    var topicNew = req.body;
    var tid = ObjectId(topicNew._id);
    var uid = ObjectId(req.signedCookies.uid);
    
    db.collection('topics').findOneAsync({ '_id': tid }).then(function(topic) {
        // only the owner can update the topic
        if(!topic || !_.isEqual(topic.owner,uid))
            return utils.rejectPromiseWithNotification(403, "Only the owner can update the topic!");
        
        return topic;
    }).then(function(topic) {
        topic.name = topicNew.name;
        return db.collection('topics').updateAsync(
                { '_id': tid }, { $set: _.pick(topic,'name') }, {}).return(topic);
    }).then(manageTopicState)
      .then(_.partial(appendTopicInfoAsync,_,uid,true))
      .then(res.json.bind(res))
      .catch(utils.isOwnError,utils.handleOwnError(res));
};

function updateTopicState(topic,stageStartedEntryName) {
    return db.collection('topics').updateAsync(
        _.pick(topic, '_id'),
        { $set: _.pick(topic, 'stage', 'nextDeadline', 'rejectedReason', stageStartedEntryName) },
        {});
}

exports.query = function(req, res) {
    var tid = ObjectId(req.params.id);
    var uid = ObjectId(req.signedCookies.uid);
    
    db.collection('topics').findOneAsync({ '_id': tid }).
    then(function(topic) {
        if(null == topic)
            return utils.rejectPromiseWithNotification(404, "Topic not found!");
        else
            return appendTopicInfoAsync(topic,uid,true);
    }).
    then(res.json.bind(res)).
    catch(utils.isOwnError,utils.handleOwnError(res));
};

exports.create = function(req, res) {
    var topic = req.body;
    
    // reject empty topic names
    if(_.isEmpty(topic.name)) {
        utils.sendNotification(res, 400, "Empty topic name not allowed.");
        return;
    }
    
    // only allow new topics if they do not exist yet
    db.collection('topics').countAsync(_.pick(topic,'name')).then(function(count) {
        // topic already exists
        if(count > 0)
            return utils.rejectPromiseWithNotification(409, "Topic already exists.");
        
        topic.owner = ObjectId(req.signedCookies.uid);
        topic.pid = ObjectId(); // create random pad id
        topic.stage = C.STAGE_SELECTION; // start in selection stage
        topic.level = 0;
        topic.nextDeadline = getDeadline(topic.stage);
        
        // insert into database
        return db.collection('topics').insertAsync(topic).return(topic);
    }).then(function(topics) {
        topic.votes = 0;
        topic.participants = 0;
        appendBasicTopicInfo(topic);
        
        res.json(topic);
    }).catch(utils.isOwnError,utils.handleOwnError(res));
};

exports.delete = function(req,res) {
    var tid = ObjectId(req.params.id);
    var uid = ObjectId(req.signedCookies.uid);
    
    db.collection('topics').findOneAsync({ '_id': tid }, { 'owner': true, 'stage': true }).
    then(function(topic) {
        // only the owner can delete the topic
        // and if the selection stage has passed, nobody can
        if(!_.isEqual(topic.owner,uid) || topic.stage > C.STAGE_SELECTION)
            return utils.rejectPromiseWithNotification(401, "Only the owner can delete the topic!");
        
        return Promise.join(
            db.collection('topics').removeByIdAsync(tid),
            db.collection('topic_votes').removeAsync({'tid': tid}),
            db.collection('topic_participants').removeAsync({'tid': tid}),
            db.collection('groups').removeAsync({'tid': tid}));
    }).then(res.sendStatus.bind(res,200))
      .catch(utils.isOwnError,utils.handleOwnError(res));
};

function countVotes(tid) {
    return db.collection('topic_votes').countAsync( {'tid': tid} );
}
function countParticipants(tid) {
    return db.collection('topic_participants').countAsync( {'tid': tid} );
}

exports.vote = function(req, res) {
    var topic_vote = req.body;
    
    // assemble vote
    topic_vote.tid = ObjectId(topic_vote.tid);
    topic_vote.uid = ObjectId(req.signedCookies.uid);
    
    // TODO use findAndModify as in proposal
    db.collection('topic_votes').
    find(_.pick(topic_vote, 'tid'), {'uid': true}).toArrayAsync().
    then(function(topic_votes) {
        var count = _.size(topic_votes);
        
        // check if vote exists already
        // do not allow user to vote twice for the same topic
        if(!utils.checkArrayEntryExists(topic_votes, _.pick(topic_vote, 'uid')))
            return db.collection('topic_votes').insertAsync(topic_vote).return(++count);
        
        return count;
    }).then(res.json.bind(res));
};

exports.unvote = function(req, res) {
    var topic_vote = req.body;
    
    // assemble vote
    topic_vote.tid = ObjectId(topic_vote.tid);
    topic_vote.uid = ObjectId(req.signedCookies.uid);
    
    // remove vote and return number of current votes
    db.collection('topic_votes').removeAsync(topic_vote,true).
        then(_.partial(countVotes,topic_vote.tid)).call('toString').
        then(res.json.bind(res));
};

exports.join = function(req, res) {
    var topic_participant = req.body;
    
    // assemble participant
    topic_participant.tid = ObjectId(topic_participant.tid);
    topic_participant.uid = ObjectId(req.signedCookies.uid);
    
    // TODO use findAndModify as in proposal
    db.collection('topic_participants').
    find(_.pick(topic_participant, 'tid'), {'uid': true}).toArrayAsync().
    then(function(topic_participants) {
        var count = _.size(topic_participants);
        
        // check if user has already joined
        // do not allow user to vote twice for the same topic
        if(!utils.checkArrayEntryExists(topic_participants, _.pick(topic_participant, 'uid')))
            return db.collection('topic_participants').insertAsync(topic_participant).return(++count);
        
        return count;
    }).then(res.json.bind(res));
};

exports.unjoin = function(req, res) {
    var topic_participant = req.body;
    
    // assemble participant
    topic_participant.tid = ObjectId(topic_participant.tid);
    topic_participant.uid = ObjectId(req.signedCookies.uid);
    
    // remove participant and return number of current participants
    db.collection('topic_participants').removeAsync(topic_participant,true).
        then(_.partial(countParticipants,topic_participant.tid)).
        call('toString').then(res.json.bind(res));
};

exports.final = function(req, res) {
    var tid = req.params.id;
    var filename = path.join(appRoot.path,'files/documents',tid+'.pdf');
    res.sendFile(filename);
};
