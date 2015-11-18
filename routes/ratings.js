var _ = require('underscore');
var mongoskin = require('mongoskin');
var db = mongoskin.db('mongodb://'+process.env.IP+'/mindabout');
var ObjectId = require('mongodb').ObjectID;
var requirejs = require('requirejs');
var C = requirejs('public/js/app/constants');

/*
Ratings can be either for proposals or users.
There is no distinction in the database.
rid is either a proposal id or a user id.

ruid
rppid
*/

exports.query = function(req, res) {
    var rid = ObjectId(req.params.id);
    var gid = ObjectId(req.params.gid);
    var uid = ObjectId(req.signedCookies.uid);
    
    db.collection('ratings').findOne(
        { 'rid': rid, 'uid': uid, 'gid': gid },
        function(err, rating) {
            res.json(rating);
        });
};

exports.count = function(req, res) {
    var rid = ObjectId(req.body.id);
    var gid = ObjectId(req.body.gid);
    
    db.collection('ratings').count(
        { 'rid': rid, 'gid': gid },
        function(err, count) {
            res.json(count);
        });
};

exports.rate = function(req, res) {
    var rid = ObjectId(req.body.id);
    var gid = ObjectId(req.body.gid);
    var uid = ObjectId(req.signedCookies.uid);
    var score = req.body.score;
    
    var ratingHead = { 'rid': rid, 'gid': gid, 'uid': uid };
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
    /*return db.collection('ratings').aggregateAsync(
        [{ $match: { 'gid': gid, 'ruid': { $exists: true }}},
         { $group: { '_id': '$ruid', 'score': { $sum: '$score' }}},
         { $sort : {'score': -1 }}]).
         then(function(ratings) {
            return (0 == _.size(ratings)) ? undefined : ratings[0].rid;
         });*/
    
    // WARNING HACK FIXME
    return db.collection('ratings').findOneAsync(
        { 'gid': gid, 'ruid': { $exists: true }}).
        then(function(ratings) {
            if(!C.DEBUG)
                return (0 == _.size(ratings)) ? undefined : ratings[0].rid;
            //else
                // return random leader if size is 0
        });
};
