var _ = require('underscore');
var db = require('../database').db;
var ObjectId = require('mongodb').ObjectID;
var Promise = require('bluebird');
var requirejs = require('requirejs');
var fs = Promise.promisifyAll(require('fs'));
var path = require('path');
var appRoot = require('app-root-path');
var AsyncLock = require('async-lock');
var lock = new AsyncLock();

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

function manageConsensusStageAsync(topic, levelDuration) {
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
                get('ppid').then(function (ppid) {
                    return db.collection('proposals').
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
        return db.collection('topics').find().toArrayAsync().
            map(_.partial(manageTopicStateAsync));
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
                
                return updateTopicStateAsync(topic,stageStartedEntryName).
                       return(topic);
            });
        case C.STAGE_PROPOSAL: // we are currently in proposal stage
            return groups.createGroupsAsync(topic).then(function(groups) {
                var stageStartedEntryName;
                
                if(_.size(groups) >= cfg.MIN_GROUPS_PER_TOPIC) {
                    topic.stage = C.STAGE_CONSENSUS;
                    topic.nextDeadline = getDeadline(C.STAGE_CONSENSUS,prevDeadline);
                    stageStartedEntryName = 'stageConsensusStarted';
                } else {
                    topic.stage = C.STAGE_REJECTED;
                    topic.rejectedReason = 'REJECTED_NOT_ENOUGH_VALID_USER_PROPOSALS';
                    stageStartedEntryName = 'stageRejectedStarted';
                }
                
                topic[stageStartedEntryName] = Date.now();
                return Promise.join(topic,stageStartedEntryName);
            }).spread(function(topic,stageStartedEntryName) {
                return updateTopicStateAsync(topic,stageStartedEntryName).
                       return(topic);
            });
        case C.STAGE_CONSENSUS: // we are currently in consensus stage
            return manageConsensusStageAsync(topic);
    }
    
    return Promise.resolve(topic);
}

function appendTopicInfoAsync(topic,uid,with_details) {
    var tid = topic._id;
    
    // get pad body if asked for
    var pad_body_promise = null;
    if(with_details)
        pad_body_promise = pads.getPadHTMLAsync(topic.pid);
    
    // get number of participants and votes in this topic
    var topic_votes_promise = db.collection('topic_votes').
        find({'tid': tid}, {'uid': true}).toArrayAsync();
    var topic_proposals_promise = db.collection('proposals').
        countAsync({'tid': tid});  // NOTE: Also non-valid proposals are counted
    
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
        var highest_level = _.max(groups, function(group) {return group.level;}).level;
        var highest_level_groups = _.filter(groups, function(group) {return group.level == highest_level;});
        
        return db.collection('group_members').findOneAsync(
            {'gid': { $in: _.pluck(highest_level_groups, '_id') }, 'uid': uid}, {'gid': true});
    }).then(function(group_member) {
        return group_member ? group_member.gid : null;
    });
    
    // delete pad id if user is not owner, pid is removed from response
    if(!_.isEqual(topic.owner,uid))
        delete topic.pid;
    
    return Promise.props(_.extend(topic,{
        'body': pad_body_promise,
        'votes': topic_votes_promise.then(_.size),
        'proposals': topic_proposals_promise,
        'voted': topic_votes_promise.then(function(topic_votes) {
            return utils.checkArrayEntryExists(topic_votes, {'uid': uid});}),
        'levels': levels_promise,
        'gid': find_user_group_promise
    }));
}

exports.list = function(req, res) {
    var uid = ObjectId(req.signedCookies.uid);
    
    manageAndListTopicsAsync().then(function(topics) {
        // Promise.map does not work above
        Promise.map(topics, _.partial(appendTopicInfoAsync,_,uid,false)).
        then(res.json.bind(res));
    });
};

exports.update = function(req, res) {
    var tid = ObjectId(req.params.id);
    var uid = ObjectId(req.signedCookies.uid);
    var topicNew = req.body;
    
    db.collection('topics').findOneAsync({ '_id': tid }).then(function(topic) {
        // only the owner can update the topic
        if(!topic)
            return utils.rejectPromiseWithNotification(404, "Topic does not exist!");
        else if(!_.isEqual(topic.owner,uid))
            return utils.rejectPromiseWithNotification(403, "Only the owner can update the topic!");
        else if(topic.stage != C.STAGE_SELECTION)
            return utils.rejectPromiseWithNotification(403, "Topic may only be edited in selection stage!");
        
        return topic;
    }).then(function(topic) {
        topic.name = topicNew.name;
        return db.collection('topics').updateAsync(
                { '_id': tid }, { $set: _.pick(topic,'name') }, {}).return(topic);
    }).then(manageTopicStateAsync)
      .then(_.partial(appendTopicInfoAsync,_,uid,true))
      .then(res.json.bind(res))
      .catch(utils.isOwnError,utils.handleOwnError(res));
};

function updateTopicStateAsync(topic,stageStartedEntryName) {
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
    //var topic = req.body;
    //var topicName = topic.name;
    var data = req.body;
    var topic = {};
    topic.name = data.name;
    
    // reject empty topic names
    if(_.isEmpty(topic.name)) {
        utils.sendNotification(res, 400, "Empty topic name not allowed.");
        return;
    }
    
    // only allow new topics if they do not exist yet
    db.collection('topics').countAsync({'name': topic.name}).then(function(count) {
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
            db.collection('groups').removeAsync({'tid': tid}));
    }).then(res.sendStatus.bind(res,200))
      .catch(utils.isOwnError,utils.handleOwnError(res));
};

function countVotes(tid) {
    return db.collection('topic_votes').countAsync( {'tid': tid} );
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

exports.final = function(req, res) {
    var tid = req.params.id;
    var filename = path.join(appRoot.path,'files/documents',tid+'.pdf');
    res.sendFile(filename);
};
