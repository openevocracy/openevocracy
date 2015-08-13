var _ = require('underscore');
var mongoskin = require('mongoskin');
var db = mongoskin.db('mongodb://'+process.env.IP+'/mindabout');
var ObjectId = require('mongodb').ObjectID;
var utils = require('../utils');

exports.list = function(req, res) {
    db.collection('groups').find().toArray(function(err, groups) {
        console.log('get groups');
        res.json(groups);
    });
};

function getProposalBody(participant,gid,finished) {
    db.collection('proposals').findOne(
        { 'uid': participant._id, 'gid': gid },
        function(err, proposal) {
            utils.getPadBody(proposal.pid,
                function (body) {
                    participant.proposal_body = body;
                    finished();
                });
        });
}

// get group by id
exports.query = function(req, res) {
    
    var gid = ObjectId(req.params.id);
    
    var group = {};
    var finishedGroup = _.after(2, function() {
        res.json(group);
    })
    
    // get all participants
    db.collection('group_participants').
        find({'gid': gid}, {'uid': 1}).
        //map(function (group_participant) {return group_participant.uid;}).
        toArray(function(err, uids) {
            uids = _.map(uids,function(uid) {return uid.uid;});
            
            db.collection('users').
            find({'_id': { $in: uids }},{'_id': 1,'name': 1}).
            toArray(function(err, users) {
                group.participants = users;

                var finishedGroup_ = _.after(group.participants.length, finishedGroup);
                _.each(group.participants,function (participant) {
                    getProposalBody(participant,gid,finishedGroup_);
                });
            });
    });
    
    // get group pad or create group pad if it does not exist
    // from http://stackoverflow.com/questions/16358857/mongodb-atomic-findorcreate-findone-insert-if-nonexistent-but-do-not-update
    db.collection('groups').findAndModify(
        { '_id': gid },
        [],
        { $setOnInsert: {pid: ObjectId()}},
        { new: true, upsert: true },
        function(err, g) {
            group = _.extend(group, g);
            finishedGroup();
    });
};