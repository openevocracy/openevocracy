var _ = require('underscore');
var mongoskin = require('mongoskin');
var db = mongoskin.db('mongodb://'+process.env.IP+'/mindabout');
var ObjectId = require('mongodb').ObjectID;
var Promise = require('bluebird');
var requirejs = require('requirejs');

var C = requirejs('public/js/app/constants');
var groups = require('./groups');
var utils = require('../utils');

function getDeadline(nextStage, prevDeadline, levelDuration) {
    
    //var nextDeadline = prevDeadline || Date.now();
    var nextDeadline = Date.now();
    switch (nextStage) {
        case C.STAGE_SELECTION: // get selection stage deadline
            nextDeadline += C.DURATION_SELECTION;
            break;
        case C.STAGE_PROPOSAL: // get proposal stage deadline
            nextDeadline += C.DURATION_PROPOSAL;
            break;
        case C.STAGE_CONSENSUS: // get consensus stage deadline
            if(undefined == typeof(levelDuration))
                nextDeadline += C.DURATION_LEVEL; // deadline for first level
            else
                nextDeadline += levelDuration;
            break;
        case C.STAGE_PASSED:
        case C.STAGE_REJECTED:
            nextDeadline = C.DURATION_NONE;
            break;
    }
    
    return nextDeadline;
}

function manageConsensusStage(topic,levelDuration) {
    return groups.remixGroupsAsync(topic).then(function(nextStage) {
        var update_set_proposal;
        switch(nextStage) {
        case C.STAGE_CONSENSUS:
            // updates below are only required while we are in consensus stage
            update_set_proposal = {
                'level': (++topic.level),
                'nextDeadline': (topic.nextDeadline = getDeadline(C.STAGE_CONSENSUS,undefined,levelDuration))
            };
            break;
        case C.STAGE_PASSED:
            // updates below are only required if consensus stage is over
            update_set_proposal = {
                'stage': (topic.stage = C.STAGE_PASSED),
                'nextDeadline': (topic.nextDeadline = getDeadline(C.STAGE_PASSED)),
                'stagePassedStarted': Date.now(),
                'finalDocument': db.collection('groups').
                    findOneAsync({'tid': topic._id, 'level': topic.level},{'ppid': true}).
                    get('ppid').then(utils.getPadBodyAsync)
            };
            break;
        case C.STAGE_REJECTED:
            // updates below are only required if topic was rejected
            update_set_proposal = {
                'stage': (topic.stage = C.STAGE_REJECTED),
                'nextDeadline': (topic.nextDeadline = getDeadline(C.STAGE_REJECTED)),
                'stageRejectedStarted': Date.now()
            };
            break;
        default:
            return Promise.reject('unknown stage');
        }
        
        // update database
        return Promise.props(update_set_proposal).then(function(update_set) {
            return db.collection('topics').updateAsync(
                _.pick(topic, '_id'), { $set: update_set }, {}).
                return(_.extend(topic,update_set));
        });
    });
}
exports.manageConsensusStage = manageConsensusStage;

/*
checks if a minimum of one proposal exists
*/
function checkForExistingProposal(topic) {
    return db.collection('topic_participants').find({'tid': topic._id},{'uid': true}).
    toArrayAsync().then(function(participants) {
        return db.collection('proposals').
            countAsync({'source': {$in: _.pluck(participants,'uid')}});
    }).then(function(count) {return count > 0;});
}

function manageTopicState(topic) {
    // exit this funtion if stage transition is not due yet
    if(Date.now()<topic.nextDeadline)
        return Promise.resolve(topic);
    
    // move to next stage
    var prevDeadline = topic.nextDeadline;
    switch (topic.stage) {
        case C.STAGE_SELECTION: // we are currently in selection stage
            return checkForExistingProposal(topic).then(function(condition) {
                if(condition) {
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
                    var stageStartedEntryName = 'stageRejectedStarted';
                    topic[stageStartedEntryName] = Date.now();
                }
                
                return updateTopicState(topic,stageStartedEntryName).
                       return(topic);
            });
        case C.STAGE_PROPOSAL: // we are currently in proposal stage
            // update topic
            topic.stage = C.STAGE_CONSENSUS;
            topic.nextDeadline = getDeadline(C.STAGE_PROPOSAL,prevDeadline);
            var stageStartedEntryName = 'stageConsensusStarted';
            topic[stageStartedEntryName] = Date.now();
            
            return Promise.join(groups.createGroups(topic),
                                updateTopicState(topic,stageStartedEntryName)).
                   return(topic);
        case C.STAGE_CONSENSUS: // we are currently in consensus stage
            return manageConsensusStage(topic,C.DURATION_LEVEL);
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

function appendExtendedTopicInfoAsync(topic,uid,with_details) {
    var tid = topic._id;
    
    // get pad body if asked for
    var pad_body_promise = null;
    if(with_details)
        pad_body_promise = utils.getPadBodyAsync(topic.pid);
    
    // get owner name
    var owner_name_promise = db.collection('users').
        findOneAsync({'_id': topic.owner}, {'name': true}).get('name');
    
    // get number of participants and votes in this topic
    var topic_votes_promise = db.collection('topic_votes').
        find({'tid': tid}, {'uid': true}).toArrayAsync();
    var topic_participants_promise = db.collection('topic_participants').
        find({'tid': tid}, {'uid': true}).toArrayAsync();
    
    // TODO http://stackoverflow.com/questions/5681851/mongodb-combine-data-from-multiple-collections-into-one-how
    
    // get groups with highest level
    var find_user_proup_promise =
    db.collection('groups').find({ 'tid': tid }).sort({ 'level': -1 }).
        //map(function (group) {return group._id;}).
        toArrayAsync().then(function(groups) {
            if(_.isEmpty(groups))
                return null;
            
            // TODO use mongodb map for better performance
            var gids = _.pluck(groups, '_id');
            
            // find the group out of previously found groups
            // that the current user is part of
            return db.collection('group_members').findOneAsync(
                {'gid': { $in: gids }, 'uid': uid}, {'gid': true}).
                then(function(group_member) {
                    return group_member ? group_member.gid : null;
                });
        });
    
    // delete pad id if user is not owner, pid is removed from response
    if(!_.isEqual(topic.owner,uid))
        delete topic.pid;
    
    return Promise.props(_.extend(topic,{
        'body': pad_body_promise,
        'ownerName': owner_name_promise,
        'votes': topic_votes_promise.then(_.size),
        'participants': topic_participants_promise.then(_.size),
        'voted': topic_votes_promise.then(function(topic_votes) {
            return utils.checkArrayEntryExists(topic_votes, {'uid': uid});}),
        'joined': topic_participants_promise.then(function(topic_participants) {
            return utils.checkArrayEntryExists(topic_participants, {'uid': uid});}),
        'gid': find_user_proup_promise,
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
        if(!topic || !_.isEqual(topic.owner,uid)) {
            res.sendStatus(403);
            return Promise.reject();
        }
        
        return topic;
    }).cancellable().then(function(topic) {
        topic.name = topicNew.name;
        return db.collection('topics').updateAsync(
                { '_id': tid }, { $set: _.pick(topic,'name') }, {}).return(topic);
    }).then(manageTopicState)
      .then(_.partial(appendTopicInfoAsync,_,uid,true))
      .then(res.json.bind(res));
};

function updateTopicState(topic,stageStartedEntryName) {
    return db.collection('topics').updateAsync(
        _.pick(topic, '_id'),
        { $set: _.pick(topic, 'stage', 'nextDeadline', stageStartedEntryName) },
        {});
}

exports.query = function(req, res) {
    var tid = ObjectId(req.params.id);
    var uid = ObjectId(req.signedCookies.uid);
    
    db.collection('topics').findOneAsync({ '_id': tid }).
    then(function(topic) {
        if(null == topic)
            return Promise.reject(404);
        else
            return appendTopicInfoAsync(topic,uid,true);
    }).
    then(res.json.bind(res)).
    catch(_.partial(res.sendStatus,404));
};

exports.create = function(req, res) {
    var topic = req.body;
    
    // reject empty topic names
    if(_.isEmpty(topic.name)) {
        res.sendStatus(400);
        return;
    }
    
    // only allow new topics if they do not exist yet
    db.collection('topics').countAsync(_.pick(topic,'name')).then(function(count) {
        // topic already exists
        if(count > 0) {
            res.sendStatus(409);
            return Promise.reject();
        }
        
        topic.owner = ObjectId(req.signedCookies.uid);
        topic.pid = ObjectId(); // create random pad id
        topic.stage = C.STAGE_SELECTION; // start in selection stage
        topic.level = 0;
        topic.nextDeadline = getDeadline(topic.stage);
        
        // insert into database
        return db.collection('topics').insertAsync(topic);
    }).then(function(topics) {
        var topic = _.first(topics);
        
        topic.votes = 0;
        topic.participants = 0;
        appendBasicTopicInfo(topic);
        
        res.json(topic);
    });
};

exports.delete = function(req,res) {
    var tid = ObjectId(req.params.id);
    var uid = ObjectId(req.signedCookies.uid);
    
    db.collection('topics').findOneAsync({ '_id': tid }, { 'owner': true }).
    then(function(topic) {
        // only the owner can delete the topic
        if(!_.isEqual(topic.owner,uid)) {
            res.sendStatus(401);
            return Promise.reject();
        }
        
        return Promise.join(
            db.collection('topics').removeByIdAsync(tid),
            db.collection('topic_votes').removeAsync({'tid': tid}),
            db.collection('topic_participants').removeAsync({'tid': tid}),
            db.collection('groups').removeAsync({'tid': tid}));
    }).cancellable().then(_.partial(res.sendStatus,200));
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
