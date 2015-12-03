var _ = require('underscore');
var mongoskin = require('mongoskin');
var db = mongoskin.db('mongodb://'+process.env.IP+'/mindabout');
var ObjectId = require('mongodb').ObjectID;
var Promise = require('bluebird');
var ratings = require('./ratings');
var utils = require('../utils');
var requirejs = require('requirejs');
var C = requirejs('public/js/app/constants');

// promisify mongoskin
Object.keys(mongoskin).forEach(function(key) {
  var value = mongoskin[key];
  if (typeof value === "function") {
    Promise.promisifyAll(value);
    Promise.promisifyAll(value.prototype);
  }
});
Promise.promisifyAll(mongoskin);

function getDeadline(nextStage, prevDeadline) {
    
    var nextDeadline = prevDeadline || Date.now();
    switch (nextStage) {
        case C.STAGE_SELECTION: // get selection stage deadline
            nextDeadline += C.DEADLINE_SELECTION;
            break;
        case C.STAGE_PROPOSAL: // get proposal stage deadline
            nextDeadline += C.DEADLINE_PROPOSAL;
            break;
        case C.STAGE_CONSENSUS: // get consensus stage deadline
            nextDeadline += C.DEADLINE_LEVEL; // deadline for first level
            break;
    }
    
    return nextDeadline;
}

function manageTopicState(topic) {
    // exit this funtion if stage transition is not due yet
    if(Date.now()<topic.nextDeadline)
        return Promise.resolve(topic);
    
    // move to next stage
    var prevDeadline = topic.nextDeadline;
    switch (topic.stage) {
        case C.STAGE_SELECTION: // we are currently in selection stage
            if(topic.participants < C.MIN_PARTICIPANTS_PER_TOPIC) {
                // topic has been rejected
                // move to rejection stage
                topic.stage = C.STAGE_REJECTED;
                var stageStartedEntryName = 'stageRejectedStarted';
                topic[stageStartedEntryName] = Date.now();
            } else {
                // topic does meet the minimum requirements for the next stage
                // move to next stage
                topic.stage = C.STAGE_PROPOSAL;
                topic.nextDeadline = getDeadline(C.STAGE_PROPOSAL,prevDeadline); // get deadline for proposal stage
                var stageStartedEntryName = 'stageProposalStarted';
                topic[stageStartedEntryName] = Date.now();
            }
            
            return updateTopicState(topic,stageStartedEntryName).
                   return(topic);
        case C.STAGE_PROPOSAL: // we are currently in proposal stage
            // update topic
            topic.stage = C.STAGE_CONSENSUS;
            topic.nextDeadline = getDeadline(C.STAGE_PROPOSAL,prevDeadline);
            var stageStartedEntryName = 'stageConsensusStarted';
            topic[stageStartedEntryName] = Date.now();
            
            return Promise.join(createGroups(topic),
                                updateTopicState(topic,stageStartedEntryName))
                          .return(topic);
        case C.STAGE_CONSENSUS: // we are currently in consensus stage
            return remixGroupsAsync(topic).then(function(nextStage) {
                var updateSet;
                switch(nextStage) {
                case C.STAGE_CONSENSUS:
                    // updates below are only required while we are in consensus stage
                    updateSet = {
                        'level': (++topic.level),
                        'nextDeadline': (topic.nextDeadline = prevDeadline + 1000*60*5) // in 5 minutes
                    };
                    break;
                case C.STAGE_PASSED:
                    // updates below are only required if consensus stage is over
                    updateSet = {
                        'stage': (topic.stage = C.STAGE_PASSED),
                        'nextDeadline': (topic.nextDeadline = C.DEADLINE_NONE)
                    };
                    break;
                case C.STAGE_REJECTED:
                    // updates below are only required if topic was rejected
                    updateSet = {
                        'stage': (topic.stage = C.STAGE_REJECTED),
                        'nextDeadline': (topic.nextDeadline = C.DEADLINE_NONE)
                    };
                    break;
                default:
                    return Promise.reject('unknown stage');
                }
                
                // update database
                return db.collection('topics').updateAsync(
                    { '_id': topic._id }, { $set: updateSet }, {}).return(topic);
            });
    }
    
    return Promise.resolve(topic);
}

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
    
    var topic_votes_promise = db.collection('topic_votes').
        find({'tid': tid}, {'uid': 1}).toArrayAsync();
    var topic_participants_promise = db.collection('topic_participants').
        find({'tid': tid}, {'uid': 1}).toArrayAsync();
    
    // TODO http://stackoverflow.com/questions/5681851/mongodb-combine-data-from-multiple-collections-into-one-how
    
    // get groups with highest level
    var find_user_proup_promise = db.collection('groups').find({ 'tid': tid }).sort({ 'level': -1 }).
        //map(function (group) {return group._id;}).
        toArrayAsync().then(function(groups) {
            if(_.isEmpty(groups))
                return null;
            
            // TODO use mongodb map for better performance
            var gids = _.map(groups, function (group) {return group._id;});
            
            // find the group out of previously found groups
            // that the current user is part of
            return db.collection('group_participants').findOneAsync(
                {'gid': { $in: gids }, 'uid': uid}, {'gid': 1}).
                then(function(group_participant) {
                    if(group_participant)
                        return group_participant.gid;
                    return null;
                });
        });
    
    // delete pad id if user is not owner, pid is removed from response
    if(topic.owner.toString() != uid.toString())
        delete topic.pid;
    
    return Promise.props(_.extend(topic,{
        'body': pad_body_promise,
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
        if(!topic || topic.owner.toString() != uid.toString()) {
            res.sendStatus(403);
            return Promise.reject();
        }
        
        return topic;
    }).cancellable().then(function(topic) {
        topic.name = topicNew.name;
        return db.collection('topics').updateAsync(
                { '_id': tid }, { $set: {name: topicNew.name} }, {}).return(topic);
    }).then(manageTopicState)
      .then(_.partial(appendTopicInfoAsync,_,uid,true))
      .then(res.json.bind(res));
};

function calculateNumberOfGroups(numParticipants) {
    
    // constants
    var groupSize = 4.5; // group size is 4 or 5
    var limitSimpleRule = 50; // number of topic_participants (if more then x topic_participants, complex rule is used)
    // calculated values
    var groupMinSize = (groupSize-0.5);
    var groupMaxSize = (groupSize+0.5);
    
    var numGroups;
    if(numParticipants>limitSimpleRule)
        numGroups = numParticipants/groupSize; // simple rule, ideally all groups are 5, group size 4 only exception
    else
        numGroups = numParticipants/groupMaxSize; // complex rule, 4 and 5 uniformly distributed
    numGroups = Math.ceil(numGroups); // round up to next integer
    console.log('rounded groups: '+numGroups);
    
    return numGroups;
}

/*function initialGroups() {
    // get participants from topics
    
    mixGroups(participants);
}*/

/*function remixGroups() {
    // get leaders from groups
    
    mixGroups(leaders);
}*/

// TODO move to groups?
function createGroups(topic) {
    var tid = topic._id;
    
    // find topic_participants
    return db.collection('topic_participants').find({ 'tid': tid }).
    toArrayAsync().then(function(topic_participants) {
        var numTopicParticipants = topic_participants.length;
        console.log('numTopicParticipants: '+numTopicParticipants);
        
        // compute number of groups
        var numGroups = calculateNumberOfGroups(numTopicParticipants);
        
        // shuffle topic_participants
        _.shuffle(topic_participants);
        console.log('participants shuffled');
        
        // initialize empty groups
        var groups = new Array(numGroups);
        for(var i=0; i<numGroups; ++i)
            groups[i] = [];
        
        // push topic_participants into groups
        _.each(topic_participants, function(participant) {
            // find first smallest group
            var group = _.min(groups, function(group) {return group.length;});
            group.push(participant.uid);
        });
        
        // log group participant distribution
        var counts = _.countBy(groups, function(group) {return group.length;});
        console.log('groups filled: ' + JSON.stringify(counts));
        
        // insert all groups into database
        return Promise.map(groups, function(group) {
            // create group new id
            var gid = ObjectId();
            
            // create group's proposal
            var ppid = ObjectId();
            var create_group_proposal_promise =
            db.collection('proposals').insertAsync({
                '_id': ppid, 'source': gid,
                'pid': ObjectId()});
            
            // create group itself
            var create_group_promise =
            db.collection('groups').insertAsync({
                '_id': gid, 'tid': tid,
                'ppid': ppid, 'level': 0});
            
            // insert group participant
            var insert_group_participants_promise =
            db.collection('group_participants').insertAsync(
                _.map(group, function(uid) {return { 'gid': gid, 'uid': uid }; }));
            
            // create participants for this group
            // append gid to proposal so we can identify it later
            var update_source_proposals_promise =
            db.collection('proposals').updateAsync(
                { 'tid': tid, 'uid': { $in: group } }, { $set: { 'sink': gid } });
            
            return Promise.join(
                    create_group_proposal_promise,
                    create_group_promise,
                    insert_group_participants_promise,
                    update_source_proposals_promise);
        });
    });
}
exports.createGroups = createGroups;

// TODO move to groups?
function remixGroupsAsync(topic) {
    var tid = topic._id;

    // get groups with highest level
    return db.collection('groups').find({ 'tid': tid }).sort({ 'level': -1 }).
        toArrayAsync().then(function(groups_in) {
        
        // return true, if we only have one group then the consensus stage is over
        if(0 == groups_in.length)
            return true;
        
        // get highest level number
        var highestLevel = groups_in[0].level;
        
        // get all group leaders
        var leader_promises =
        Promise.map(groups_in, function(group_in) {
            // skip if this is a lower level group
            if(group_in.level != highestLevel)
                return;
            
            // get group leader
            return ratings.getGroupLeader(group_in._id);
        });
        
        return Promise.join(leader_promises, highestLevel);
    }).spread(function(leaders,highestLevel) {
        // remove all undefined leaders
        leaders = _.compact(leaders);
        var numLeaders = leaders.length;
        
        if(1 == numLeaders)
            // if there is only ONE leader, then the topic is finished/passed.
            return C.STAGE_PASSED;
        else if(0 == numLeaders)
            // if there is NO leader, then the consensus stage has failed.
            return C.STAGE_REJECTED;
        
        // shuffle group leaders
        _.shuffle(leaders);
        
        // compute number of groups
        var numGroups = calculateNumberOfGroups(numLeaders);
        
        // initialize empty groups_out
        var groups_out = new Array(numGroups);
        for(var i=0; i<numGroups; ++i)
            groups_out[i] = [];
        
        // push leaders into groups_out
        _.each(leaders, function(leader) {
            // find first smallest group
            var group_out = _.min(groups_out, function(group_out) {return group_out.length;});
            group_out.push(leader);
        });
        
        // insert all groups into database
        var nextLevel = highestLevel+1;
        return Promise.map(groups_out, function(group_out) {
            // create group new id
            var gid = ObjectId();
            
            // create group's proposal
            var ppid = ObjectId();
            var create_group_proposal_promise =
            db.collection('proposals').insertAsync({
                '_id': ppid, 'source': gid,
                'pid': ObjectId()});
            
            // create group itself
            var create_group_promise =
            db.collection('groups').insertAsync({
                '_id': gid, 'tid': tid,
                'ppid': ppid, 'level': nextLevel});
            
            // insert group members
            var create_participants_promise =
            db.collection('group_participants').insertAsync(
                _.map(group_out,function(uid) {return { 'gid': gid, 'uid': uid };}));
            
            // register as sink for source proposals
            // find previous gids corresponding uids in group_out (current group)
            var update_source_proposals_promise =
            db.collection('group_participants').findAsync({'uid': { $in: group_out }}).
            then(function(group_participants) {
                var gids = _.pluck(group_participants,'gid');
                
                // filter out only previous level proposals
                var prevLevel = highestLevel;
                return db.collection('groups').findAsync(
                    {'level': prevLevel, 'gid': { $in: gids }}, {'gid': true});
            }).then(function(source_groups) {
                var sources = _.pluck(source_groups,'gid');
                
                // update sink of previous proposals
                return db.collection('proposals').updateAsync(
                    { 'tid': tid, 'source': { $in: sources } }, { $set: { 'sink': gid } });
            });
            
            return Promise.join(
                create_group_proposal_promise,
                create_group_promise,
                create_participants_promise,
                update_source_proposals_promise);
        }).return(C.STAGE_CONSENSUS); // we stay in consensus stage
    });
}

function updateTopicState(topic,stageStartedEntryName) {
    return db.collection('topics').updateAsync(
        { '_id': topic._id },
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
    catch(res.sendStatus.bind(res,404));
};

exports.create = function(req, res) {
    var topic = req.body;
    
    // reject empty topic names
    if(topic.name == "") {
        console.log("Couldn't create new topic: Topic name is empty.");
        res.sendStatus(400);
        return;
    }
    
    // only allow new topics if they do not exist yet
    db.collection('topics').count( { name: topic.name }, function(err, count) {
        console.log(JSON.stringify(topic));
        console.log(count);
        
        // topic already exists
        if(count > 0) {
            console.log("Couldn't create new topic! - topic already exists");
            res.sendStatus(409);
            return;
        }
        
        topic.owner = ObjectId(req.signedCookies.uid);
        topic.pid = ObjectId(); // create random pad id
        topic.stage = C.STAGE_SELECTION; // start in selection stage
        topic.level = 0;
        topic.nextDeadline = getDeadline(topic.stage);
        
        // insert into database
        db.collection('topics').insert(topic, function(err, topics) {
            var topic = topics[0];
            
            topic.votes = 0;
            topic.participants = 0;
            appendBasicTopicInfo(topic);
            
            res.json(topic);
            console.log('new topic');
        });
    });
};

exports.delete = function(req,res) {
    var tid = ObjectId(req.params.id);
    var uid = ObjectId(req.signedCookies.uid);
    
    db.collection('topics').findOneAsync({ '_id': tid }, { 'owner': 1 }).then(
    function(topic) {
        // only the owner can delete the topic
        if(topic.owner.toString() != uid.toString()) {
            res.sendStatus(401);
            return Promise.reject();
        }
        
        return db.collection('topics').removeByIdAsync(tid);
    }).cancellable().then(res.sendStatus.bind(res,200));
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
    find(_.pick(topic_vote, 'tid'), {'uid': 1}).toArrayAsync().
    then(function(topic_votes) {
        var count = _.size(topic_votes);
        
        // check if vote exists already
        if(!utils.checkArrayEntryExists(topic_votes, _.pick(topic_vote, 'uid'))) {
            // do not allow user to vote twice for the same topic
            db.collection('topic_votes').insertAsync(topic_vote);
            ++count;
        }
        
        res.json(count);
    });
};

exports.unvote = function(req, res) {
    var topic_vote = req.body;
    
    // assemble vote
    topic_vote.tid = ObjectId(topic_vote.tid);
    topic_vote.uid = ObjectId(req.signedCookies.uid);
    
    // remove vote and return number of current votes
    db.collection('topic_votes').removeAsync(topic_vote,true).
        then(countVotes.bind(undefined,topic_vote.tid)).call('toString').
        then(res.json.bind(res));
};

exports.join = function(req, res) {
    var topic_participant = req.body;
    
    // assemble participant
    topic_participant.tid = ObjectId(topic_participant.tid);
    topic_participant.uid = ObjectId(req.signedCookies.uid);
    
    // TODO use findAndModify as in proposal
    db.collection('topic_participants').
    find(_.pick(topic_participant, 'tid'), {'uid': 1}).toArrayAsync().
    then(function(topic_participants) {
        var count = _.size(topic_participants);
        
        // check if user has already joined
        if(!utils.checkArrayEntryExists(topic_participants, _.pick(topic_participant, 'uid'))) {
            // do not allow user to vote twice for the same topic
            db.collection('topic_participants').insertAsync(topic_participant);
            ++count;
        }
        
        res.json(count);
    });
};

exports.unjoin = function(req, res) {
    var topic_participant = req.body;
    
    // assemble participant
    topic_participant.tid = ObjectId(topic_participant.tid);
    topic_participant.uid = ObjectId(req.signedCookies.uid);
    
    // remove participant and return number of current participants
    db.collection('topic_participants').removeAsync(topic_participant,true).
        then(countParticipants.bind(undefined,topic_participant.tid)).
        call('toString').then(res.json.bind(res));
};
