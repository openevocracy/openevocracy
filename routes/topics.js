var _ = require('underscore');
var request = require('request');
var mongoskin = require('mongoskin');
var db = mongoskin.db('mongodb://'+process.env.IP+'/mindabout');
var ObjectId = require('mongodb').ObjectID;
var requirejs = require('requirejs');
var C = requirejs('public/js/app/constants');
//var C = require('public/js/app/constants');
/*var C = {
    STAGE_REJECTED  : -1,
    STAGE_SELECTION :  0,
    STAGE_PROPOSAL  :  1,
    STAGE_CONSENSUS :  2
};*/

function count_votes(response,tid) {
    db.collection('topic_votes').count( {'tid': tid}, function(err, count) {
        response.send(count.toString());
    });
}

function count_participants(response,tid) {
    db.collection('topic_participants').count( {'tid': tid}, function(err, count) {
        response.send(count.toString());
    });
}

function getDeadline(nextStage, prevStageDeadline) {
    
    var ONE_WEEK = 1000*60*60*24*7; // one week milliseconds
    
    // calculate
    var nextStageDeadline = prevStageDeadline || Date.now();
    switch (nextStage) {
        case C.STAGE_SELECTION: // get selection stage deadline
            nextStageDeadline += (2*ONE_WEEK); // two weeks
            break;
        case C.STAGE_PROPOSAL: // get proposal stage deadline
            nextStageDeadline += ONE_WEEK;
            break;
        case C.STAGE_CONSENSUS: // get consensus stage deadline
            nextStageDeadline = 0; // no deadline in consensus stage
            break;
    }
    
    return nextStageDeadline;
}

function manageTopicState(topic) {
    // exit this funtion if stage transition is not due yet
    if(Date.now()<topic.nextStageDeadline)
        return;
    
    // move to next stage
    var prevStageDeadline = topic.nextStageDeadline;
    switch (topic.stage) {
        case C.STAGE_SELECTION: // we are currently in selection stage
            var MIN_PARTICIPANTS = 2;
            if(topic.participants < MIN_PARTICIPANTS) {
                // topic has been rejected
                // move to rejection stage
                topic.stage = C.STAGE_REJECTED;
                
                // update database
                var stageStartedEntryName = 'stageRejectedStarted';
                topic[stageStartedEntryName] = Date.now();
                updateTopicState(topic,stageStartedEntryName);
            } else {
                // topic does meet the minimum requirements for the next stage
                // move to next stage
                ++topic.stage;
                topic.nextStageDeadline = getDeadline(C.STAGE_PROPOSAL,prevStageDeadline); // get deadline for proposal stage
                
                // update database
                var stageStartedEntryName = 'stageProposalStarted';
                topic[stageStartedEntryName] = Date.now();
                updateTopicState(topic,stageStartedEntryName);
            }
            break;
        case C.STAGE_PROPOSAL: // we are currently in proposal stage
            ++topic.stage;
            //topic.nextStageDeadline = ..; // TODO see below
            createGroups(topic);
            
            // update database
            var stageStartedEntryName = 'stageConsensusStarted';
            topic[stageStartedEntryName] = Date.now();
            updateTopicState(topic,stageStartedEntryName);
            break;
        case C.STAGE_CONSENSUS: // we are currently in consensus stage
            //++topic.stage; // TODO consensus stage should be handled with separate logic
            // e.g. when groups are finished
            break;
    }
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
    }
}

function appendExtendedTopicInfo(topic,uid,finishedTopic) {
    var tid = topic._id;
    
    // get html export
    var padurl = 'https://beta.etherpad.org/p/'+topic.pid+'/export/html';
    request.get(padurl,
        function(error, response, data) {
            var str = data.replace(/\r?\n/g, "");
            var body = str.replace(/^.*?<body[^>]*>(.*?)<\/body>.*?$/i,"$1");
            topic.desc = body;
            finishedTopic(topic);
        });
    
    // check if current user is owner
    db.collection('topics').findOne(
        { '_id': tid },
        function(err) {
            // delete pad id if user is not owner, pid is removed from response
            if(topic.owner != uid)
                delete topic.pid;
            
            finishedTopic(topic);
        });
    
    // append number of votes for this topic
    db.collection('topic_votes').count(
        {'tid': tid},
        function(err, count) {
            topic.votes = count;
            finishedTopic(topic);
        });
    
    // check if user has voted for topic
    db.collection('topic_votes').count(
        {'tid': tid, 'uid': uid},
        function(err, count) {
            topic.voted = count;
            finishedTopic(topic);
        });
    
    // append number of members for this topic
    db.collection('topic_participants').count(
        {'tid': tid},
        function(err, count) {
            topic.participants = count;
            finishedTopic(topic);
        });
    
    // check if user has joined topic
    db.collection('topic_participants').count(
        {'tid': tid, 'uid': uid},
        function(err, count) {
            topic.joined = count;
            finishedTopic(topic);
        });
    
    // get groups with highest level
    // FIXME http://stackoverflow.com/questions/22118210/using-findone-in-mongodb-to-get-element-with-max-id
    db.collection('groups').find({ 'tid': tid, 'level': -1 }).toArray(
        function(err, groups) {
            // find the group out of previously found groups
            // that the current user is part of
            db.collection('group_participants').findOne(
                {'gid': groups, 'uid': uid},
                function(err, group_participant) {
                    topic.gid = group_participant.gid;
                    finishedTopic(topic);
                });
        });
}

function appendTopicInfo(topic,uid,finished) {
    // send response only if all queries have completed
    var finishedTopic = _.after(7+1, function(topic) {
        // send response
        finished(topic);
    });
    
    appendExtendedTopicInfo(topic,uid,finishedTopic);
    {
        appendBasicTopicInfo(topic);
        finishedTopic(topic);
    }
}

exports.list = function(req, res) {
    db.collection('topics').find().toArray(function(err, topics) {
       
        console.log('get topics');

        // send response only if all queries have completed
        var finished = _.after(topics.length, function(topic) {
            res.json(topics);
        });

        // loop over all topics        
        _.each(topics,function(topic) {
            appendTopicInfo(topic,ObjectId(req.signedCookies.uid),finished);
            manageTopicState(topic);
        });
    });
};

exports.update = function(req, res) {
    var topicNew = req.body;
    
    db.collection('topics').findOne({ '_id': ObjectId(topicNew._id) }, function(err, topic) {
        // only the owner can update the topic
        if(topic.owner != ObjectId(req.signedCookies.uid)) {
            res.json(topic);
            return;
        }
        
        db.collection('topics').update(
            { '_id': topic._id }, { $set: {name: topicNew.name} }, 
            {}, function (err, topic) {res.json(topic);});
    });
};

function createGroups(topic) {
    // constants
    var groupSize = 4.5; // group size is 4 or 5
    var limitSimpleRule = 50; // number of topic_participants (if more then x topic_participants, complex rule is used)
    
    // calculated values
    var groupMinSize = (groupSize-0.5);
    var groupMaxSize = (groupSize+0.5);
    
    // find topic_participants
    db.collection('topic_participants').find({ 'tid': topic._id }).toArray(
    function(err, topic_participants) {
        var numTopicParticipants = topic_participants.length;
        
        console.log('numTopicParticipants: '+numTopicParticipants);
        
        // compute number of groups
        var numGroups;
        if(numTopicParticipants>limitSimpleRule)
            numGroups = numTopicParticipants/groupSize; // simple rule, ideally all groups are 5, group size 4 only exception
        else
            numGroups = numTopicParticipants/groupMaxSize; // complex rule, 4 and 5 uniformly distributed
        numGroups = Math.ceil(numGroups); // round up to next integer
        
        console.log('rounded groups: '+numGroups);
        
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
        _.each(groups, function(group) {
            // create group new id
            var gid = ObjectId();
            
            // create group itself
            db.collection('groups').insert({'_id': gid,'tid': topic.tid,'level': 0},
                                           function(err) {});
            
            // create participants for this group
            _.each(group, function(uid) {
                db.collection('group_participants').insert(
                    {'gid':gid,'uid':uid},
                    function(err, group_participant){
                        console.log('new group_participant');
                    });
            });
        });
    });
}
exports.createGroups = createGroups;

function updateTopicState(topic,stageStartedEntryName) {
    db.collection('topics').update(
        { '_id': topic._id },
        { $set: _.pick(topic, 'stage', 'nextStageDeadline', stageStartedEntryName) },
        {}, function (err, inserted) {});
}

exports.query = function(req, res) {
    db.collection('topics').findOne({ '_id': ObjectId(req.params.id) }, function(err, topic) {
        appendTopicInfo(topic,ObjectId(req.signedCookies.uid),function(topic) {res.json(topic);});
        manageTopicState(topic);
    });
};

exports.create = function(req, res) {
    var topic = req.body;

    // only allow new topics if they do not exist yet
    db.collection('topics').count( { name: topic.name }, function(err, count) {
        console.log(JSON.stringify(topic));
        console.log(count);
        
        // topic already exists
        if(count > 0 ) {
            console.log("Couldn't create new Topic! - Topic already exists")
            res.json({});
            return;
        }
        if(topic.name=="") {
            console.log("Couldn't create new Topic! - Topic Name is empty")
            res.json({});
            return;
        }
        
        topic.owner = req.signedCookies.uid;
        topic.pid = ObjectId(); // create random pad id
        topic.stage = C.STAGE_SELECTION;
        topic.level = 0;
        topic.nextStageDeadline = getDeadline(topic.stage);
        
        // insert into database
        db.collection('topics').insert(topic, function(err, topics){
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
    db.collection('topics').findOne({ '_id': ObjectId(req.params.id) }, function(err, topic) {
        // only the owner can delete the topic
        if(topic.owner != ObjectId(req.signedCookies.uid)) {
            res.json({deleted: false});
            return;
        }
        
        db.collection('topics').removeById(topic._id, function() {
            res.json({deleted: true});
        });
    });
};

exports.vote = function(req, res) {
    var topic_vote = req.body;
    
    topic_vote.tid = ObjectId(topic_vote.tid);
    // get user id and put into vote
    topic_vote.uid = ObjectId(req.signedCookies.uid);
    // TODO use findAndModify as in proposal
    db.collection('topic_votes').count(topic_vote, function(err, count) {
        // do not allow user to vote twice for the same topic
        if(0 == count) {
            db.collection('topic_votes').insert(topic_vote, function(err, topic_vote) {
                // return number of current votes
                count_votes(res,topic_vote[0].tid);
            });
            console.log('user ' + topic_vote.uid + ' voted for topic ' + topic_vote.tid );
        } else
            // return number of current votes
            count_votes(res,topic_vote.tid);
    });
    
};

exports.unvote = function(req, res) {
    var topic_vote = req.body;
    
    topic_vote.tid = ObjectId(topic_vote.tid);
    // get user id and put into vote
    topic_vote.uid = ObjectId(req.signedCookies.uid);
    // remove entry
    db.collection('topic_votes').remove(topic_vote,true,
        function(vote,err) {
            // return number of current votes
            count_votes(res,topic_vote.tid);
        });
};

exports.join = function(req, res) {
    var topic_participant = req.body;
    
    topic_participant.tid = ObjectId(topic_participant.tid);
    // get user id and put into vote
    topic_participant.uid = ObjectId(req.signedCookies.uid);
    // TODO use findAndModify as in proposal
    db.collection('topic_participants').count( topic_participant, function(err, count) {
        // do not allow user to vote twice for the same topic
        if(0 == count) {
            db.collection('topic_participants').insert(topic_participant, function(err, topic_participant) {
                // return number of current votes
                count_participants(res,topic_participant[0].tid);
            });
            console.log('user ' + topic_participant.uid + ' joined topic ' + topic_participant.tid );
        } else
            // return number of current topic_participants
            count_participants(res,topic_participant.tid);
    });
};

exports.unjoin = function(req, res) {
    var topic_participant = req.body;
    
    topic_participant.tid = ObjectId(topic_participant.tid);
    // get user name and put into vote
    topic_participant.uid = ObjectId(req.signedCookies.uid);
    // remove entry
    db.collection('topic_participants').remove(topic_participant,true,
        function(member,err) {
            // return number of current topic_participants
            count_participants(res,topic_participant.tid);
        });
};
