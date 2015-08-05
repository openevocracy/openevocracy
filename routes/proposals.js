var _ = require('underscore');
var mongoskin = require('mongoskin');
var db = mongoskin.db('mongodb://'+process.env.IP+'/mindabout');
var ObjectId = require('mongodb').ObjectID;
var utils = require('../utils');
var requirejs = require('requirejs');
var C = requirejs('public/js/app/constants');

exports.query = function(req, res) {
    console.log('req ' + JSON.stringify(req.params));
    var tid = ObjectId(req.params.id);
    var uid = ObjectId(req.signedCookies.uid);
    
    var requestValid = _.after(2, function() {
        // get proposal or create proposal if it does not exist
        // from http://stackoverflow.com/questions/16358857/mongodb-atomic-findorcreate-findone-insert-if-nonexistent-but-do-not-update
        db.collection('proposals').findAndModify(
            { 'tid':tid, 'uid':uid },
            [],
            { $setOnInsert: {pid: ObjectId()}},
            { new: true, upsert: true },
            function(err, proposal) {
                // append pad body
                utils.getPadBody(proposal.pid,
                function(body) {
                    proposal.body = body;
                    res.json(proposal);
                });
        });
    });
    var requestInvalid = function() {
        res.status(400).send('Bad Request');
    }
    
    // check if topic is in proposal stage
    console.log('tid ' + JSON.stringify(tid));
    db.collection('topics').findOne({ '_id': tid }, function(err, topic) {
        if(topic.stage >= C.STAGE_PROPOSAL)
            requestValid();
        else
            requestInvalid();
    });
    
    // check if user has joined topic
    db.collection('topic_participants').count(
        {'tid': tid, 'uid': uid},
        function(err, count) {
            if(count > 0)
                requestValid();
            else
                requestInvalid();
    });
};