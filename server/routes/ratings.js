// General libraries
var _ = require('underscore');
var db = require('../database').db;
var ObjectId = require('mongodb').ObjectID;

// Own references
var C = require('../../shared/constants').C;

// NOTE Currently not in use
// called if ratings are queried, responds with rating from database
exports.query = function(req, res) {
	var ratedUserId = ObjectId(req.params.id);
	var groupId = ObjectId(req.params.gid);
	var userId = ObjectId(req.user._id);
	var type = parseInt(req.params.type, 10);
	
	db.collection('ratings')
		.findOneAsync({ 'groupId': groupId, 'userId': userId, 'ratedUserId': ratedUserId, 'type': type })
		.then(res.json.bind(res));
};

// NOTE Currently not in use
// @desc: Counts number of given ratings per group for specific type of rating
exports.count = function(req, res) {
	var ratedUserId = ObjectId(req.body.id);
	var groupId = ObjectId(req.body.gid);
	var type = parseInt(req.params.type, 10);
	
	db.collection('ratings')
		.countAsync({ 'groupId': groupId, 'ratedUserId': ratedUserId, 'type': type })
		.then(res.json.bind(res));
};

/*
 * desc: Save rating
 */
exports.rate = function(req, res) {
	var ratedUserId = ObjectId(req.body.ratedUserId); // The user who was rated
	var groupId = ObjectId(req.body.groupId);
	var userId = ObjectId(req.user._id);
	console.log(ratedUserId, groupId, userId);
	var type = parseInt(req.body.type, 10);
	var score = parseInt(req.body.score, 10);
	
	// Return 402: score is not between 1 and 5
	if(score < 1 || score > 5) {
		res.sendStatus(402);
		return;
	}
    
	db.collection('ratings').updateAsync(
		{ 'ratedUserId': ratedUserId, 'groupId': groupId, 'userId': userId, 'type': type },
		{ $set: { 'score': score } }, { upsert: true })
	.then(function(rating) {
		return true;
	}).then(res.json.bind(res));
};

/*
 * @desc: Return the user with the highest overall ratings
 * @param: group id
 */
exports.getGroupLeaderAsync = function(groupId) {
	return db.collection('ratings')
		.find({ 'groupId': groupId }, { 'ratedUserId': true, 'score': true }).toArrayAsync()
		.then(function(ratings) {
			if(_.isEmpty(ratings))
			    return undefined;
			
			var grouped_ratings = _.groupBy(ratings, 'ratedUserId');
			// Should now have the form: (where n is the number of ratings every user got)
			// {ratedUserId1: [{'ratedUserId': ratedUserId1, 'score': x_1},...,{'ratedUserId': ratedUserId1, 'score': x_n}], ratedUserId2: [{'ratedUserId': ratedUserId2, score: x_1},...,{'ratedUserId': ratedUserId2, score: x_n}], ...}
			
			var summed_ratings = _.map(grouped_ratings,function(array, ratedUserId) {
				// Array contains multiple ratings, ratedUserId contains the rated user
				// array = [{'ratedUserId': ratedUserId1, 'score': x_1},...,{'ratedUserId': ratedUserId1, 'score': x_n}]
				// ratedUserId = ratedUserId1
				
				var scores = _.pluck(array, 'score');
				// scores = [x_1,...,x_n]
				
				return {'ratedUserId': ratedUserId, 'score': _.reduce(scores, function(memo, num){ return memo + num; }, 0)};
			});
			// summed_ratings = [{'ratedUserId': ratedUserId1, 'score': sum1}, {'ratedUserId': ratedUserId2, 'score': sum2}, ...]
			
			// TODO find better solution, if more than one have the same rating
			var best_rating = _.max(summed_ratings, function(rating) {return rating.score;});
			// best_rating = {'ratedUserId': ratedUserId_max, 'score': sum_max}
			return ObjectId(best_rating.ratedUserId);
	});
};

exports.getMemberRatingsAsync = function(ratedUserId, groupId, userId) {
	return db.collection('ratings').find(
		{ 'ratedUserId': ratedUserId, 'groupId': groupId, 'userId': userId }, { '_id': false, 'type': true, 'score': true })
	.toArrayAsync().then(function(ratings) {
		// Create array with all rating types
		const types = [C.RATING_KNOWLEDGE, C.RATING_INTEGRATION, C.RATING_ENGAGEMENT];
		// Map through all types
		return _.map(types, (type) => {
			// Have a look if rating for current type is present
			const rating = _.findWhere(ratings, { 'type': type });
			// If rating is available, set rating to current score, if not, just set it to zero
			const score = rating ? rating.score : 0;
			// Return rating
			return { 'type': type, 'score': score };
		});
	});
};

exports.getMemberRatingAsync = function(ratedUserId, groupId, userId, type) {
	return db.collection('ratings').findOneAsync(
		{'ratedUserId': ratedUserId, 'groupId': groupId, 'userId': userId, 'type': type}, {'score': true}).
	then(function(rating) {
		return rating ? rating.score : 0;
	});
};
