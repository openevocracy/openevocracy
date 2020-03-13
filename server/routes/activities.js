// General libraries
var _ = require('underscore');
var db = require('../database').db;
var ObjectId = require('mongodb').ObjectID;
var Promise = require('bluebird');

// Own references
const C = require('../../shared/constants').C;
var utils = require('../utils');

/**
 * @desc: Gets all activities from database that satisfy the filter
 * @params: filter: a JSON object specifying what is queried
 * @return: {object} activites
 */
function getActivitiesAsync(filter) {
	return db.collection('user_activities').find(filter).toArrayAsync();
}
exports.getActivitiesAsync = getActivitiesAsync;

/*
 * @desc: Get whole activity list of a particular user
 */
exports.getUserActivityList = function(req, res) {
	const targetUserId = ObjectId(req.params.id);
   const requestingUserId = ObjectId(req.user._id);
   
   // Get skip and limit from query
	const skip = parseInt(req.query.skip, 10);
	const limit = parseInt(req.query.limit, 10);
   
   // Get privacy level of activity based on social relation between users
   const privacyLevel = getPrivacyLevel(requestingUserId, targetUserId);
   
   // Get activities from database, filtered by privacy level
	db.collection('user_activities').find({ 'userId': targetUserId, 'privacyLevel': { '$lte': privacyLevel } })
		.sort( [['_id', -1]] ).skip(skip).limit(limit).toArrayAsync()
		.then(res.json.bind(res));
};

/*
 * @desc: Returns the length of the whole activity list of a particular user
 */
exports.getUserActivityListLength = function(req, res) {
	const targetUserId = ObjectId(req.params.id);
   const requestingUserId = ObjectId(req.user._id);
   
   // Get privacy level of activity based on social relation between users
   const privacyLevel = getPrivacyLevel(requestingUserId, targetUserId);
   
   return db.collection('user_activities').find({ 'userId': targetUserId, 'privacyLevel': { '$lte': privacyLevel } })
   	.countAsync().then(res.json.bind(res));
};

/**
 * @desc: Get privacy level of activity based on social relation between users
 */
function getPrivacyLevel(requestingUserId, targetUserId) {
	//socialRelation = socialnet.getSocialRelationType(requestingUserId, targetUserId)
	
	let privacyLevel = C.ACT_PLVL_ALL;
   /*if (socialRelation == C.MATE)
   	privacyLevel = C.ACT_PLVL_MATES;*/
   	
   return privacyLevel;
}

/**
 * @desc: Get list of specified activities of specified users
 */
exports.getSpecificActivities = function(req, res) {
	getActivitiesAsync().then(res.json.bind(res)); // up to now returns all activities, TODO
};

/**
 * @desc: Query a specific activity
 */
exports.query = function(req, res) { // not tested yet / probably not properly implemented
   const activityId = ObjectId(req.activityId);
   const userId = ObjectId(req.userId);
   
   db.collection('user_activities').findOneAsync({ '_id': activityId })
      .then(function(act) {
         if(_.isNull(act))
            return utils.rejectPromiseWithMessage(404, 'NOT_FOUND');
         else
            return act;
      }).then(res.json.bind(res))
      .catch(utils.isOwnError, utils.handleOwnError(res));
};

/**
 * @desc: Stores an activity in the database
 */
function addActivity(userId, type, targetId) {
	
	// Get privacy level for current activity type from user activity settings
	return db.collection('user_activity_settings').findOneAsync({ 'userId': userId }).then((privacySettings) => {
		// Get privacy level of current type, if value is falsy, set privacy level to 0 (all)
		const privacyLevel = (privacySettings ? privacySettings[type] : C.ACT_PLVL_ALL);
		
		// Define activity object
		const activity = {
			'_id': ObjectId(),
			'userId': userId,
			'type': type,
			'targetId': targetId,
			'privacyLevel': privacyLevel
		};
		
		// Adds object to database
		return db.collection('user_activities').insertAsync(activity);
	});
}
exports.addActivity = addActivity;


/**
 * @desc: Creates an activity (to be called from POST)
 */
/*exports.create = function(req, res) {
	const type = req.body.type;
	const targetId = ObjectId(req.body.targetId);
	const userId = ObjectId(req.user._id);

   // Reject if user id or target id is missing
   if(!userId || !targetId)
      return utils.rejectPromiseWithMessage(400, 'BAD_REQUEST');

   // Stores activity in database
   addActivity(userId, type, targetId)
      .then(res.json.bind(res)).catch(utils.isOwnError, utils.handleOwnError(res));
};*/


/**
 * @desc: Deletes a specific activity
 */
exports.delete = function(req,res) {
	const actId = ObjectId(req.params.id);
	const userId = ObjectId(req.user._id);
	
	// FIXME: Why this? (comment from Carlo)
	db.collection('user_activities').findOneAsync({ '_id': actId }).then(function(activity) {
		return db.collection('user_activities').removeByIdAsync(activity._id)
			.then(res.json.bind(res));
	});
};
