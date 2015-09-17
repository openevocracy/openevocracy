var _ = require('underscore');
var mongoskin = require('mongoskin');
var db = mongoskin.db('mongodb://'+process.env.IP+'/mindabout');
var ObjectId = require('mongodb').ObjectID;
var requirejs = require('requirejs');
var C = requirejs('public/js/app/constants');

var topics = require('./topics');

var tid = ObjectId('54f646ccc3a414a60d40d660');

exports.fill_topic_participants = function(req, res) {
    for(i = 0; i < 1000; ++i) {
        db.collection('topic_participants').insert(
            {'tid':tid,'uid':ObjectId()},
            function(err, topic_participants){
                console.log('new topic_participants');
            });
    }
    for(i = 0; i < 40; ++i) {
        db.collection('topic_participants').insert(
            {'tid':tid,'uid':ObjectId()},
            function(err, topic_participants){
                console.log('new topic_participants');
            });
    }
    
    res.send('successfull');
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

    res.send('successfull');
};

exports.create_test_suite = function(req, res) {
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
    
    res.send('successfull');
};