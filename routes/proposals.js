var _ = require('underscore');
var mongoskin = require('mongoskin');
var db = mongoskin.db('mongodb://'+process.env.IP+'/mindabout');
var ObjectId = require('mongodb').ObjectID;
var requirejs = require('requirejs');
var C = requirejs('public/js/app/constants');

exports.query = function(req, res) {
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
                res.json(proposal);
        });
    });
    var requestInvalid = function() {
        res.status(400).send('Bad Request');
    }
    
    // check if topic is in proposal stage
    db.collection('topics').findOne({ '_id': tid }, function(err, topic) {
        if(C.STAGE_PROPOSAL == topic.stage)
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