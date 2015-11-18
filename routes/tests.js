var _ = require('underscore');
var mongoskin = require('mongoskin');
var db = mongoskin.db('mongodb://'+process.env.IP+'/mindabout');
var ObjectId = require('mongodb').ObjectID;
var Promise = require('bluebird');
var requirejs = require('requirejs');
var C = requirejs('public/js/app/constants');

var topics = require('./topics');

var tid = ObjectId('54f646ccc3a414a60d40d660');

/*
standard test suite
*/
exports.create_standard_suite = function(req, res) {
    var tid = ObjectId();
    var gid = ObjectId();
    
    var u123 = ObjectId('553e912d04a3d9811b120fbf');
    var ucarlo = ObjectId('553e911b04a3d9811b120fbe');
    
    // create topic
    var ONE_WEEK = 1000*60*60*24*7; // one week milliseconds
    db.collection('topics').insert({
        '_id': tid,
        'name': 'TestTopic'+Date.now(),
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

function fill_topic_participants(tid, num_participants) {
    var topic_participants = [];
    for(var i = 0; i < num_participants; ++i)
        topic_participants.push({'tid':tid,'uid':ObjectId()});
    
    return db.collection('topic_participants').insertAsync(topic_participants);
};

exports.create_groups = function(req, res) {
    /*db.collection('groups').remove({tid:'54ff453cfec7e11108ca2f65'},true,
        function(topic_participant,err) {
        });
    createGroups({_id:'54ff453cfec7e11108ca2f65'});*/
    
    db.collection('groups').remove({'tid':tid},true,
        function(topic_participant,err) {
        });
    var topic = {'_id':tid};
    topics.createGroups(topic);

    res.sendStatus(200);
};

/*
test suite for testing of group remix
*/
exports.remix_groups = function(req, res) {
    // create topic
    var ONE_MINUTE = 1000*60; // one minute milliseconds
    
    var tid = ObjectId();
    
    Promise.join(
        db.collection('topics').insertAsync({
            '_id': tid,
            'name': 'RemixGroupTest'+Date.now(),
            'owner': ObjectId(req.signedCookies.uid),
            'pid': ObjectId(),
            'stage': C.STAGE_CONSENSUS,
            'level': 0,
            'nextDeadline': Date.now() + ONE_MINUTE
        }),
        fill_topic_participants(tid,1000),
        topics.createGroups({'_id':tid})
    ).then(res.sendStatus.bind(res,200));
};