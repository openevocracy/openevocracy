var _ = require('underscore');
var db = require('../database').db;
var ObjectId = require('mongodb').ObjectID;
var requirejs = require('requirejs');
var C = requirejs('public/js/setup/constants');

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
    
    var rating = { 'gid': gid, 'uid': uid };
    rating[type] = rid;
    db.collection('ratings').findOneAsync(rating).then(res.json.bind(res));
};

exports.query_user_rating = _.partial(query, _, _, 'ruid');
exports.query_proposal_rating = _.partial(query, _, _, 'rppid');

function count(req, res, type) {
    var rid = ObjectId(req.body.id);
    var gid = ObjectId(req.body.gid);
    
    var rating = { 'gid': gid };
    rating[type] = rid;
    db.collection('ratings').countAsync(rating).then(res.json.bind(res));
};

exports.count_user_rating = _.partial(count, _, _, 'ruid');
exports.count_proposal_rating = _.partial(count, _, _, 'rppid');

function rate(req, res, type) {
    var rid = ObjectId(req.body.id);
    var gid = ObjectId(req.body.gid);
    var uid = ObjectId(req.signedCookies.uid);
    var score = req.body.score;
    
    // return 404 score is not between 1 and 5
    if(score < 0 || score > 5) {
        res.sendStatus(402);
        return;
    }
    
    var ratingHead = { 'gid': gid, 'uid': uid };
    ratingHead[type] = rid;
    db.collection('ratings').updateAsync(
        ratingHead,
        { $set: { 'score': score } },
        { upsert: true }).
    then(_.partial(res.sendStatus,200));
};

exports.rate_user_rating = _.partial(rate, _, _, 'ruid');
exports.rate_proposal_rating = _.partial(rate, _, _, 'rppid');

/*
return the user with the highest overall ratings
@param gid group id
*/
exports.getGroupLeader = function(gid) {
    return db.collection('ratings').find(
        { 'gid': gid, 'ruid': { $exists: true }},
        { 'ruid': true, 'score': true }).
        toArrayAsync().then(function(ratings) {
            if(_.isEmpty(ratings))
                return undefined;
            
            var grouped_ratings = _.groupBy(ratings,'ruid');
            // should now have the form:
            // {ruid1: [{'ruid': ruid1, 'score': x_1},...,{'ruid': ruid1, 'score': x_5}], ruid2: [{'ruid': ruid2, score: x_1},...,{'ruid': ruid2, score: x_5}], ...}
            
            var summed_ratings = _.map(grouped_ratings,function(array,ruid) {
                // array contains multiple ratings, ruid contains the rated user
                // array = [{'ruid': ruid1, 'score': x_1},...,{'ruid': ruid1, 'score': x_5}]
                // ruid = ruid1
                
                var scores = _.pluck(array,'score');
                // scores = [x_1,...,x_5]
                
                return {'ruid': ruid, 'score': _.reduce(scores, function(memo, num){ return memo + num; }, 0)};
            });
            // summed_ratings = [{'ruid': ruid1, 'score': sum1}, {'ruid': ruid2, 'score': sum2}, ...]
            
            // TODO find better solution, if more than one have the same rating
            var best_rating = _.max(summed_ratings,function(rating) {return rating.score;});
            // best_rating = {'ruid': ruid_max, 'score': sum_max}
            return best_rating.ruid;
        });
};
