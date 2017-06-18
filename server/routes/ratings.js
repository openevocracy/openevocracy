var _ = require('underscore');
var db = require('../database').db;
var ObjectId = require('mongodb').ObjectID;
var requirejs = require('requirejs');
var C = requirejs('public/js/setup/constants');

/*
 * Ratings can be either for knowledge or intigration skill.
 *
 * _id -> timestamp
 * uid -> user who rated
 * gid -> group
 * ruid -> rated user
 */

// NOTE Currently not in use
// called if ratings are queried, responds with rating from database
exports.query = function(req, res) {
    var rid = ObjectId(req.params.id);
    var gid = ObjectId(req.params.gid);
    var uid = ObjectId(req.signedCookies.uid);
    var type = parseInt(req.params.type, 10);
    
    db.collection('ratings').
        findOneAsync({ 'gid': gid, 'uid': uid, 'ruid': rid, 'type': type }).
        then(res.json.bind(res));
};

// NOTE Currently not in use
// counts number of given ratings per group for specific type of rating
exports.count = function(req, res) {
    var rid = ObjectId(req.body.id);
    var gid = ObjectId(req.body.gid);
    var type = parseInt(req.params.type, 10);
    
    db.collection('ratings').
        countAsync({ 'gid': gid, 'ruid': rid, 'type': type }).
        then(res.json.bind(res));
};

// save rating
exports.rate = function(req, res) {
    var rid = ObjectId(req.body.id);
    var gid = ObjectId(req.body.gid);
    var uid = ObjectId(req.signedCookies.uid);
    var type = parseInt(req.body.type, 10);
    var score = parseInt(req.body.score, 10);
    
    // return 404 score is not between 1 and 5
    if(score < 0 || score > 5) {
        res.sendStatus(402);
        return;
    }
    
    db.collection('ratings').updateAsync(
        { 'ruid': rid, 'gid': gid, 'uid': uid, 'type': type },
        { $set: { 'score': score } },
        { upsert: true }).
    then(res.sendStatus.bind(res,200));
};

/*
 * return the user with the highest overall ratings
 * @param gid group id
 */
exports.getGroupLeaderAsync = function(gid) {
    return db.collection('ratings').find(
        { 'gid': gid },
        { 'ruid': true, 'score': true }).
        toArrayAsync().then(function(ratings) {
            if(_.isEmpty(ratings))
                return undefined;
            
            var grouped_ratings = _.groupBy(ratings, 'ruid');
            // should now have the form: (where n is the number of ratings every user got)
            // {ruid1: [{'ruid': ruid1, 'score': x_1},...,{'ruid': ruid1, 'score': x_n}], ruid2: [{'ruid': ruid2, score: x_1},...,{'ruid': ruid2, score: x_n}], ...}
            
            var summed_ratings = _.map(grouped_ratings,function(array, ruid) {
                // array contains multiple ratings, ruid contains the rated user
                // array = [{'ruid': ruid1, 'score': x_1},...,{'ruid': ruid1, 'score': x_n}]
                // ruid = ruid1
                
                var scores = _.pluck(array, 'score');
                // scores = [x_1,...,x_n]
                
                return {'ruid': ruid, 'score': _.reduce(scores, function(memo, num){ return memo + num; }, 0)};
            });
            // summed_ratings = [{'ruid': ruid1, 'score': sum1}, {'ruid': ruid2, 'score': sum2}, ...]
            
            // TODO find better solution, if more than one have the same rating
            var best_rating = _.max(summed_ratings,function(rating) {return rating.score;});
            // best_rating = {'ruid': ruid_max, 'score': sum_max}
            return ObjectId(best_rating.ruid);
        });
};
