// General libraries
var _ = require('underscore');
var db = require('../database').db;
var ObjectId = require('mongodb').ObjectID;
var Promise = require('bluebird');

// Own references
const C = require('../../shared/constants').C;
var utils = require('../utils');


/**
 * @desc: Sets a user as follower of another user
 * - srcUserId: the user who follows
 * - targetUserId: the user who is being followed
 */
function follow(srcUserId, targetUserId) {
	
	db.collection('users_followers').insertAsync( { 'targetUserId': targetUserId, 'followedBy': srcUserId } );
	
}
exports.follow = follow;

/**
 * @desc: Remove a user as follower of another user
 */
function unfollow(req, res) {

	const srcUserId = ObjectId(req.user._id); // the user who follows
	const targetUserId = ObjectId(req.params.id); // the user who is being followed

	db.collection('user_followers').findOneAsync({ 'targetUserId': targetUserId, 'followedBy': srcUserId }).then(function(frelation) {
		return db.collection('user_followers').removeByIdAsync(frelation._id)
			.then(res.json.bind(res));
	});
};
exports.unfollow = unfollow;


/**
 * @desc: Sends a user a mate request (that means, an entry in the mates database is created but the 'status' flag is still < 3)
 * - srcUserId: the user who sends the request
 * - targetUserId: the user who receives the request
 */
function mateRequest(srcUserId, targetUserId) {
	db.collection('user_mates')
     .find({ 'user1': srcUserId, 'user2': targetUserId })
     .toArrayAsync()
     .then((mate) => {
			if (_.isEmpty(mate)) { // if this combination was not found, look the other way around
	   		db.collection('user_mates')
				   .findOneAsync({ 'user1': targetUserId }, { 'user2': srcUserId })
				   .then((mate) => {
				   	if (_.isEmpty(mate)) // if this combination was not found either, create an entry
				   	{
				   		db.collection('user_mates').insertAsync( { 'user1': srcUserId, 'user2': targetUserId, 'status': 1 } );
				   	}
				   	else if (mate.status == 1) // previous request by targetUser found -> being mates accepted by both parties, set status to 3
				   	{
				   		db.collection.updateAsync(
								   { 'user1': targetUserId, 'user2': srcUserId },
								   { $set: {status: 3 } }
								);
				   		
				   	}
				   });
	   	}
	   	else if (mate.status == 2) // previous request by targetUser found -> being mates accepted by both parties, set status to 3
	   	{
	   		db.collection.updateAsync(
					   { 'user1': srcUserId, 'user2': targetUserId },
					   { $set: {status: 3 } }
					);
	   	}
	   	return 0;
	   });
}
exports.mateRequest = mateRequest;

/**
 * @desc: Returns true if a user follows another one
 * - srcUserId: the user who follows
 * - targetUserId: the user who is being followed
 * @return true if the users are mates, false if not
 */
function isFollowerRelation(srcUserId, targetUserId) {
	
	return db.collection('user_relations')
	         .findOneAsync({ 'targetUserId': targetUserId, 'srcUserId': srcUserId })
	         .then((follower) => {
	         	if(_.isEmpty(follower))
	         		return false;
	         	else	
	         		return true;
	         });
}
exports.isFollowerRelation = isFollowerRelation;


/**
 * @desc: Returns the mate relation between two users
 * - user1: the first user
 * - user2: the second user
 * @return returns 3 if the users are mates; 1 if a mate request by user1 is pending; 2 if a mate request by user2 is pending; 0 else
 */
function getMateRelation(userA, userB) {
	
	return db.collection('user_relations')
		//.find({ 'user1': user1, 'user1': user2 })
		.find({ 'userA': { $in: [ userA, userB ] }, 'userB': { $in: [ userA, userB ] } })
		.toArrayAsync()
		.then((mate) => {
			if (!_.isEmpty(mate))
			{
				if (mate.status == 1)
		   		return 1;
		   	else if (mate.status == 2)
		   		return 2;
		   	else if (mate.status == 3)
		   		return 3;
			}
			return 0;
	});
}
exports.getMateRelation = getMateRelation;


/**
 * @desc: Returns the social relation type between two users
 * - user1: the first user
 * - user2: the second user
 * @return 
 */
function getSocialRelationType(user1, user2) {
	return db.collection('user_relations').find
}
exports.getSocialRelationType = getSocialRelationType;