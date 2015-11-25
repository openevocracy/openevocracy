var _ = require('underscore');
var mongoskin = require('mongoskin');
var db = mongoskin.db('mongodb://'+process.env.IP+'/mindabout');
var ObjectId = require('mongodb').ObjectID;
var requirejs = require('requirejs');
var C = requirejs('public/js/app/constants');

/*
Ratings can be either for proposals or users.

_id -> timestamp
uid -> user who rated
gid -> group
ruid -> rated user
rppid -> rated proposal
*/

function query(req, res, type) {
    var rid = ObjectId(req.params.id);
    var gid = ObjectId(req.params.gid);
    var uid = ObjectId(req.signedCookies.uid);
    
    db.collection('ratings').findOne(
        { type: rid, 'uid': uid, 'gid': gid },
        function(err, rating) {
            res.json(rating);
        });
};

exports.query_user_rating = _.partial(query, _, _, 'ruid');
exports.query_proposal_rating = _.partial(query, _, _, 'rppid');

function count(req, res, type) {
    var rid = ObjectId(req.body.id);
    var gid = ObjectId(req.body.gid);
    
    db.collection('ratings').count(
        { type: rid, 'gid': gid },
        function(err, count) {
            res.json(count);
        });
};

exports.count_user_rating = _.partial(count, _, _, 'ruid');
exports.count_proposal_rating = _.partial(count, _, _, 'rppid');

function rate(req, res, type) {
    var rid = ObjectId(req.body.id);
    var gid = ObjectId(req.body.gid);
    var uid = ObjectId(req.signedCookies.uid);
    var score = req.body.score;
    
    // FIXME if check score is between 1 and 5
    
    var ratingHead = { type: rid, 'gid': gid, 'uid': uid };
    db.collection('ratings').update(
        ratingHead,
        { $set: { 'score': score } },
        { upsert: true },
        function(err, rating) {
            res.sendStatus(200);
        });
};

exports.rate_user_rating = _.partial(rate, _, _, 'ruid');
exports.rate_proposal_rating = _.partial(rate, _, _, 'rppid');

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
            return (0 == _.size(ratings)) ? undefined : ratings[0].ruid;
         });*/
    
    /*// WARNING HACK FIXME
    return db.collection('ratings').findOneAsync(
        { 'gid': gid, 'ruid': { $exists: true }}).
        then(function(ratings) {
            if(!C.DEBUG)
                return (0 == _.size(ratings)) ? undefined : ratings[0].ruid;
            //else
                // return random leader if size is 0
        });*/
        
    return db.collection('ratings').findAsync(
        { 'gid': gid, 'ruid': { $exists: true }},
        { 'ruid': true, 'score': true }).
        then(function(ratings) {
            if(_.isEmpty(ratings))
                return undefined;
            
            var grouped_ratings = _.groupBy(ratings,'ruid');
            // should now have the form:
            // {ruid1: [{'ruid': ruid1, 'score': x_1},...,{'ruid': ruid1, 'score': x_5}], ruid2: [{'ruid': ruid2, score: x_1},...,{'ruid': ruid2, score: x_5}], ...}
            
            var summed_ratings = _.map(grouped_ratings,function(array,ruid) {
                // array = {ruid1: [{'ruid': ruid1, 'score': x_1},...,{'ruid': ruid1, 'score': x_5}]}
                // ruid = ruid1
                
                var scores = _.pluck(array,'score');
                // scores = [x_1,...,x_5]
                
                return {'ruid': array[ruid], 'score': _.reduce(scores)};
            });
            // summed_ratings = [{'ruid': ruid1, 'score': sum1}, {'ruid': ruid2, 'score': sum2}, ...]
            
            var best_rating = _.max(summed_ratings,function(rating) {return rating.score;});
            // best_rating = {'ruid': ruid_max, 'score': sum_max}
            return best_rating.ruid;
        });
};