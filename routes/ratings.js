var _ = require('underscore');
var mongoskin = require('mongoskin');
var db = mongoskin.db('mongodb://'+process.env.IP+'/mindabout');
var ObjectId = require('mongodb').ObjectID;
var requirejs = require('requirejs');
var C = requirejs('public/js/app/constants');

/*
Ratings can be either for proposals or users.
There is no distinction in the database.
_id is either a proposal id or a user id.
*/

exports.query = function(req, res) {
    var id = ObjectId(req.params.id);
    var gid = ObjectId(req.params.gid);
    var uid = ObjectId(req.signedCookies.uid);
    
    db.collection('ratings').findOne(
        { '_id': id, 'uid': uid, 'gid': gid },
        function(err, rating) {
            res.json(rating);
        });
};

exports.count = function(req, res) {
    var id = ObjectId(req.body.id);
    var gid = ObjectId(req.body.gid);
    
    db.collection('ratings').count(
        { '_id': id, 'gid': gid },
        function(err, count) {
            res.json(count);
        });
};

exports.rate = function(req, res) {
    var id = ObjectId(req.body.id);
    var gid = ObjectId(req.body.gid);
    var uid = ObjectId(req.signedCookies.uid);
    var score = req.body.score;
    
    var ratingHead = { '_id': id, 'gid': gid, 'uid': uid };
    db.collection('ratings').update(
        ratingHead,
        { $set: { 'score': score } },
        { upsert: true },
        function(err, rating) {
            res.sendStatus(200);
        });
};

/*
return the user with the highest overall ratings
@param gid group id
*/
exports.getGroupLeader = function(gid) {
    return db.collection('ratings').aggregate(
        [{ $match: { 'gid': gid } },
         { $group: { '_id': '$uid', 'score': { $sum: '$score' }}}]).
        sort({ 'score': -1 }).limitAsync(1).get('uid');
}