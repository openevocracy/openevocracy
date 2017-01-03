var _ = require('underscore');
var db = require('../database').db;
var ObjectId = require('mongodb').ObjectID;
var Promise = require('bluebird');
var requirejs = require('requirejs');
var C = requirejs('public/js/setup/constants');

var topics = require('./topics');
var groups = require('./groups');

var tid = ObjectId('54f646ccc3a414a60d40d660');

exports.clean_database = function(req, res) {
    db.collection('documents').drop();
    db.collection('pads').drop();
    db.collection('proposals').drop();
    db.collection('snapshots').drop();
    db.collection('topic_votes').drop();
    db.collection('topics').drop();
    db.collection('groups').drop();
    db.collection('group_members').drop();
    
    res.sendStatus(200);
}

/*
standard test suite
*/
exports.create_topic_consensus_stage = function(req, res) {
    var tid = ObjectId();
    var gid = ObjectId();
    
    var upatrick = ObjectId('56f54aad389ff3b433a212f3');
    var ucarlo = ObjectId('56f54b01389ff3b433a212f4');
    
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
    
    // create participants for this topic
    db.collection('topic_participants').insert(
                  [{'tid':tid,'uid':upatrick},
                   {'tid':tid,'uid':ucarlo}],
                  function (){});
    
    // create group
    db.collection('groups').insert({
        '_id': gid,
        'tid': tid,
        'pid': ObjectId(),
        'level': 0
    },function (){});
    
    // create members for this group
    db.collection('group_members').insert(
                  [{'gid':gid,'uid':upatrick},
                   {'gid':gid,'uid':ucarlo}],
                  function (){});
    
    // create proposals for this group
    db.collection('proposals').insert(
                  [{'tid':tid,'gid':gid,'source':upatrick},
                   {'tid':tid,'gid':gid,'source':ucarlo}],
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
    
    var topic_participants_promise =
        db.collection('topic_participants').insertAsync(topic_participants);
    
    // FIXME must create proposals too!
    //var topic_proposals_promise =
    //    db.collection('proposals').insertAsync(function ()
    
    return topic_participants_promise;
}

function fill_topic_user_ratings(topic) {
    // get all groups of topic with current level
    return db.collection('groups').find(
        {'tid': topic._id, 'level': topic.level}, {'_id': true}).
    // get the corresponding group members
    toArrayAsync().then(function(groups) {
        return db.collection('group_members').
            find({'gid': { $in: _.pluck(groups,'_id') }}, {'_id': false}).
            toArrayAsync();
    // create a rating for each member
    }).map(function(group_member) {
        return {'ruid': group_member.uid, 'gid': group_member.gid, 'score': 3};
    // insert all ratings into database
    }).then(db.collection('ratings').insertAsync.bind(db.collection('ratings')));
}

exports.create_groups = function(req, res) {
    Promise.join(db.collection('groups').removeAsync({'tid':tid},true),
                 topics.createGroupsAsync({'_id':tid})).
            then(_.partial(res.sendStatus,200));
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
    then(_.partial(fill_topic_participants,tid,10)).
    then(_.partial(groups.createGroupsAsync,{'_id':tid})).
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
                    return db.collection('group_members').countAsync({'gid': group._id}).
                    then(function(count) {
                        response_text += count + " ";
                    });
                });
            });
        },true)).then(function() {res.status(200).send("<pre>"+response_text+"</pre>");});
};