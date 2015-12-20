var _ = require('underscore');
var mongoskin = require('mongoskin');
var db = mongoskin.db('mongodb://'+process.env.IP+'/mindabout');
var ObjectId = require('mongodb').ObjectID;
var Promise = require('bluebird');
var requirejs = require('requirejs');
var C = requirejs('public/js/app/constants');

var topics = require('./topics');
var groups = require('./groups');

var tid = ObjectId('54f646ccc3a414a60d40d660');

/*
standard test suite
*/
exports.create_topic_consensus_stage = function(req, res) {
    var tid = ObjectId();
    var gid = ObjectId();
    
    var u123 = ObjectId('561eac9846a2e86816ada238');
    var ucarlo = ObjectId('561eac6546a2e86816ada237');
    
    // create topic
    var ONE_WEEK = 1000*60*60*24*7; // one week milliseconds
    db.collection('topics').insert({
        '_id': tid,
        'name': 'ConsensusTest'+Date.now(),
        'owner': ObjectId(req.signedCookies.uid),
        'pid': ObjectId(),
        'stage': C.STAGE_CONSENSUS,
        'level': 0,
        'nextDeadline': Date.now() + 1000*ONE_WEEK
    }, function (){});
    
    // create participants for this group
    db.collection('topic_participants').insert(
                  [{'tid':tid,'uid':u123},
                   {'tid':tid,'uid':ucarlo}],
                  function (){});
    
    // create group
    db.collection('groups').insert({
        '_id': gid,
        'tid': tid,
        'pid': ObjectId(),
        'level': 0
    },function (){});
    
    // create participants for this group
    db.collection('group_participants').insert(
                  [{'gid':gid,'uid':u123},
                   {'gid':gid,'uid':ucarlo}],
                  function (){});
    
    // create proposals for this group
    db.collection('proposals').insert(
                  [{'tid':tid,'gid':gid,'uid':u123},
                   {'tid':tid,'gid':gid,'uid':ucarlo}],
                  function (){});
    
    res.sendStatus(200);
};

exports.create_topic_proposal_stage = function(req, res) {
    
    // create topic
    var ONE_WEEK = 1000*60*60*24*7; // one week milliseconds
    db.collection('topics').insert({
        '_id': ObjectId(),
        'name': 'ProposalTest'+Date.now(),
        'owner': ObjectId(req.signedCookies.uid),
        'pid': ObjectId(),
        'stage': C.STAGE_PROPOSAL,
        'level': 0,
        'nextDeadline': Date.now() + 1000*ONE_WEEK
    }, function (){});
    
    res.sendStatus(200);
};

function fill_topic_participants(tid, num_participants) {
    var topic_participants = [];
    for(var i = 0; i < num_participants; ++i)
        topic_participants.push({'tid':tid,'uid':ObjectId()});
    
    return db.collection('topic_participants').insertAsync(topic_participants);
}

function fill_topic_user_ratings(topic) {
    // get all groups of topic with current level
    return db.collection('groups').find(
        {'tid': topic._id, 'level': topic.level}, {'_id': true}).
    // get the corresponding group participants
    toArrayAsync().then(function(groups) {
        return db.collection('group_participants').
            find({'gid': { $in: _.pluck(groups,'_id') }}, {'_id': false}).
            toArrayAsync();
    // create a rating for each participant
    }).map(function(group_participant) {
        return {'ruid': group_participant.uid, 'gid': group_participant.gid, 'score': 3};
    // insert all ratings into database
    }).then(db.collection('ratings').insertAsync.bind(db.collection('ratings')));
}

exports.create_groups = function(req, res) {
    db.collection('groups').remove({'tid':tid},true,
        function(topic_participant,err) {
        });
    var topic = {'_id':tid};
    topics.createGroups(topic);

    res.sendStatus(200);
};

// see http://stackoverflow.com/a/24660323
/*var promiseWhile = Promise.method(function(condition, action, cond_result) {
    if (!cond_result) return;
    return action().then(condition).then(_.partial(promiseWhile, condition, action, _));
});*/
function promiseWhile(condition, action, cond_result) {
    if (!cond_result) return Promise.resolve();
    return action().then(condition).then(_.partial(promiseWhile, condition, action));
};

/*
test suite for testing of group remix
*/
exports.remix_groups = function(req, res) {
    var response_text = "";
    
    var tid = ObjectId();
    db.collection('topics').insertAsync({
        '_id': tid,
        'name': 'RemixGroupTest'+Date.now(),
        'owner': ObjectId(req.signedCookies.uid),
        'pid': ObjectId(),
        'stage': C.STAGE_CONSENSUS,
        'level': 0,
        'nextDeadline': Date.now()}).
    then(_.partial(fill_topic_participants,tid,53)).
    then(_.partial(groups.createGroups,{'_id':tid})).
    then(_.partial(promiseWhile,
        function condition() {
            return db.collection('topics').findOneAsync({ '_id': tid }, { 'stage': true}).
            then(function (topic) {
                return C.STAGE_CONSENSUS == topic.stage;
            });
        },
        function action() {
            return db.collection('topics').findOneAsync({ '_id': tid }).
            then(function(topic) {return fill_topic_user_ratings(topic).return(topic);}).
            then(_.partial(topics.manageConsensusStage,_,0)).
            then(function(topic) {
                return db.collection('groups').find({ 'tid': tid, 'level': topic.level }).
                toArrayAsync().then(function(groups) {
                    response_text += "<br/>level: " + topic.level + ", number of groups: " + _.size(groups) + ", sizes of each group: ";
                    return groups;
                }).map(function(group) {
                    return db.collection('group_participants').countAsync({'gid': group._id}).
                    then(function(count) {
                        response_text += count + " ";
                    });
                });
            });
        },true)).then(function() {res.status(200).send("<pre>"+response_text+"</pre>");});
};