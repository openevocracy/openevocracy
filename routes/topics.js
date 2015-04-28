var _ = require('underscore');
var mongoskin = require('mongoskin');
var db = mongoskin.db('mongodb://'+process.env.IP+'/mindabout');
var ObjectId = require('mongodb').ObjectID;

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

function extendTopicInfo(topic,uid,finished) {
    
    // extend timeCreated
    topic.timeCreated = topic._id.getTimestamp();
    
    // extend stage name
    switch (topic.stage) {
        case 0:
            topic.stageName = "selection";
            break;
        case 1:
            topic.stageName = "proposal";
            break;
        case 2:
            topic.stageName = "consensus";
            break;
    }
    
    // extend number of votes for this topic
    var tid = topic._id;
    db.collection('topic_votes').count( {'tid': tid}, function(err, count) {
        topic.votes = count;
        
        // check if user has voted for topic
        db.collection('topic_votes').count(
            {'tid': tid, 'uid': uid},
            function(err, count) {
                topic.voted = count;
                
                // extend number of members for this topic
                db.collection('topic_participants').count( {'tid': tid}, function(err, count) {
                    topic.participants = count;
                    
                    // check if user has joined topic
                    db.collection('topic_participants').count(
                        {'tid': tid, 'uid': uid},
                        function(err, count) {
                            topic.joined = count;
                            console.log(JSON.stringify(topic));
                            // send response
                            finished(topic);
                        });
                    });
                });
    });
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
            extendTopicInfo(topic,ObjectId(req.signedCookies.uid),finished);
        });
    });
};

exports.update = function(req, res) {
    var topic = req.body;
    
    // TODO crashes server
    // // only allow new topics if they do not exist yet
    // db.collection('topics').count( { name: topic.name } )) {
    //     res.json({error:'Topic already exists!'});
    //     return;
    // }

    db.collection('topics').update(
        { '_id': ObjectId(topic._id) }, { $set: {name: topic.name, desc: topic.desc } }, 
        {}, function (err, topic) {res.json(topic);});
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
            db.collection('groups').insert({'gid': gid,'tid': topic.tid},
                                           function(err) {});
            
            // create participants for this group
            /*_.each(group, function(uid) {
                db.collection('group_participants').insert(
                    {'gid':gid,'uid':uid},
                    function(err, group_participant){
                        console.log('new group_participant');
                    });
            });*/
        });
    });
}
exports.createGroups = createGroups;

function getDeadline(givenStage) {
    
    var ONE_WEEK = 1000*60*60*24*7; // one week milliseconds
    
    // calculate
    var deadline = Date.now();
    switch (givenStage) {
        case 0: // get selection stage deadline
            deadline += ONE_WEEK;
            break;
        case 1: // get proposal stage deadline
            deadline += ONE_WEEK;
            break;
        case 2: // get consensus stage deadline
            deadline = 0; // no deadline in consensus stage
            break;
    }
    
    return deadline;
}

function manageTopicState(topic) {
    // exit this funtion if stage transition is not due yet
    if(Date.now()<topic.nextStageDeadline)
        return;
    
    // move to next stage
    switch (topic.stage) {
        case 0: // we are currently in selection stage
            ++topic.stage;
            topic.nextStageDeadline = getDeadline(1); // get deadline for proposal stage
            break;
        case 1: // we are currently in proposal stage
            ++topic.stage;
            //topic.nextStageDeadline = ..; // TODO see below
            createGroups(topic);
            break;
        case 2: // we are currently in consensus stage
            //++topic.stage; // TODO consensus stage should be handled with separate logic
            // e.g. when groups are finished
            break;
    }
    
    // update database
    db.collection('topics').update(
        { '_id': topic._id },
        { $set: {stage: topic.stage, nextStageDeadline: topic.nextStageDeadline } },
        {}, function (err, inserted) {});
}

exports.query = function(req, res) {
    db.collection('topics').findOne({ '_id': ObjectId(req.params.id) }, function(err, topic) {
        extendTopicInfo(topic,ObjectId(req.signedCookies.uid),function(topic) {res.json(topic);});
        manageTopicState(topic);
    });
};

exports.create = function(req, res) {
    var topic = req.body;

    topic.stage = 0;
    topic.level = 0;
    topic.nextStageDeadline = getDeadline(0);
    db.collection('topics').insert(topic, function(err, topic){
        res.json(topic[0]);
        console.log('new topic');
    });
};

exports.delete = function(req,res) {
    db.collection('topics').removeById(ObjectId(req.params.id), function() {
        res.json({deleted: true});
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
