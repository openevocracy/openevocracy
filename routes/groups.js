var _ = require('underscore');
var mongoskin = require('mongoskin');
var db = mongoskin.db('mongodb://'+process.env.IP+'/mindabout');
var ObjectId = require('mongodb').ObjectID;
var utils = require('../utils');

exports.list = function(req, res) {
    db.collection('groups').find().toArrayAsync().then(_.bind(res.json,res));
};

function getParticipantProposalBodyAndRating(participant,gid,uid) {
    return db.collection('proposals').findOneAsync(
        { 'uid': participant._id, 'gid': gid }).then(function(proposal) {
        // get proposal body
        var proposal_body_promise = utils.getPadBodyAsync(proposal.pid);
        
        // get proposal rating
        var proposal_rating_promise = 
        db.collection('ratings').findOneAsync(
            { '_id': proposal._id, 'gid': gid, 'uid': uid },{ 'score': 1 }).
        then(function(rating) {
            return rating ? rating.score : 0;
        });
        
        return Promise.join({
            'ppid': proposal._id,
            'proposal_body': proposal_body_promise,
            'proposal_rating': proposal_rating_promise
        });
    });
}

// get group by id
exports.query = function(req, res) {
    
    var gid = ObjectId(req.params.id);
    var uid = ObjectId(req.signedCookies.uid);
    
    // get group pad or create group pad if it does not exist
    // from http://stackoverflow.com/questions/16358857/mongodb-atomic-findorcreate-findone-insert-if-nonexistent-but-do-not-update
    var group_promise =
    db.collection('groups').findAndModifyAsync(
        { '_id': gid },
        [],
        { $setOnInsert: {pid: ObjectId()}},
        { 'new': true, 'upsert': true });
    
    // get all participants
    var participants_promise =
    db.collection('group_participants').find({'gid': gid}, {'uid': 1}).
    //map(function (group_participant) {return group_participant.uid;}).
    toArrayAsync().map(function(group_participant) {
        return group_participant.uid;
    }).then(function(uids) {
        return db.collection('users').
            find({'_id': { $in: uids }},{'_id': 1,'name': 1}).
            toArrayAsync();
    }).map(function (participant) {
        // get participant's proposal body and rating
        var proposal_body_and_rating_promise =
            getParticipantProposalBodyAndRating(participant,gid,uid);
        
        // get participant rating
        var participant_rating_promise =
        db.collection('ratings').findOneAsync(
            { '_id': participant._id, 'gid': gid, 'uid': uid },{ 'score': 1 }).
        then(function(rating) {
            return rating ? rating.score : 0;
        });
        
        return Promise.props(
            _.extend(participant,proposal_body_and_rating_promise,
                {'participant_rating': participant_rating_promise}));
    });
    
    Promise.props(_.extend(group_promise, participants_promise)).
    then(_.bind(res.json,res));
};