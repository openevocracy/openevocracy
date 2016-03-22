var _ = require('underscore');
var mongoskin = require('mongoskin');
var db = mongoskin.db('mongodb://'+process.env.IP+'/mindabout');
var ObjectId = require('mongodb').ObjectID;
var Promise = require('bluebird');
var requirejs = require('requirejs');

var C = requirejs('public/js/setup/constants');
var utils = require('../utils');

exports.query = function(req, res) {
    var tid = ObjectId(req.params.id);
    var uid = ObjectId(req.signedCookies.uid);

    // get topic
    var get_topic_promise = db.collection('topics').findOneAsync({ '_id': tid }).
    then(function(topic) {
        // check if topic is at least in proposal stage
        if(topic.stage < C.STAGE_PROPOSAL)
            return Promise.reject('Topic must be at least in proposal stage!');
        return topic;
    });
    // check if user has joined topic
    var check_user_joined_promise =
    db.collection('topic_participants').countAsync({'tid': tid, 'uid': uid}).
    then(function(count) {
        if(count == 0)
            return Promise.reject();
    });
    
    Promise.join(get_topic_promise, check_user_joined_promise, function(topic) {
        // get proposal or create proposal if it does not exist
        // from http://stackoverflow.com/questions/16358857/mongodb-atomic-findorcreate-findone-insert-if-nonexistent-but-do-not-update
        var get_proposal_promise =
        db.collection('proposals').findAndModifyAsync(
            { 'tid':tid, 'source':uid },[],
            { $setOnInsert: {pid: ObjectId()}},
            { new: true, upsert: true }).get(0);
        
        return Promise.join(topic, get_proposal_promise);
    }).spread(function(topic, proposal) {
        // get pad_body
        var get_pad_body_promise = utils.getPadBodyAsync(proposal.pid);
        // pad can only be edited in proposal stage
        if(topic.stage != C.STAGE_PROPOSAL)
            delete proposal.pid;
        
        // append pad body
        return Promise.props(_.extend(proposal,{'body': get_pad_body_promise}));
    }).then(_.bind(res.json,res)).catch(_.bind(res.sendStatus,res,400));
};