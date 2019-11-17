// General libraries
var _ = require('underscore');
var db = require('../database').db;
var ObjectId = require('mongodb').ObjectID;
var Promise = require('bluebird');

// Own references
const C = require('../../shared/constants').C;
var utils = require('../utils');

/**
 * Gets all activities from database that satisfy the filter
 * - filter: a JSON object specifying what is queried
 * 
 * @return {object} activites
 */
function getActivitiesAsync(filter) {
	return db.collection('activities').find(filter).toArrayAsync();
}
exports.getActivitiesAsync = getActivitiesAsync;

/*
 * @desc: Get whole activity list of a particular user
 */
exports.getUserActivityList = function(req, res) {
	const targetUserId = ObjectId(req.params.id);
   const requestingUserId = ObjectId(req.user._id);
   
   // Get relation level between users (anonymous, follower, mate)
   // ...
   
   //if (targetUserId)
   
	getActivitiesAsync({ 'userId': targetUserId }).then(res.json.bind(res));
	//getActivitiesAsync({ 'userId': targetUserId, 'privacyLevel': <= relationLevel }).then(res.json.bind(res));
};

/*
 * @desc: Get list of specified activities of specified users
 */
exports.getSpecificActivities = function(req, res) {
	getActivitiesAsync().then(res.json.bind(res)); // up to now returns all activities, TODO
};

exports.query = function(req, res) { // not tested yet / probably not properly implemented
   const activityId = ObjectId(req.activityId);
   const userId = ObjectId(req.userId);
   
   db.collection('activities').findOneAsync({ '_id': activityId })
      .then(function(act) {
         if(_.isNull(act))
            return utils.rejectPromiseWithMessage(404, 'NOT_FOUND');
         else
            return act;
      }).then(res.json.bind(res))
      .catch(utils.isOwnError, utils.handleOwnError(res));
};


/**
 * @desc: Creates an activity in the database
 */
function storeActivity(userId, type, targetId) {
	
	// Get privacy level for current activity type from user activity settings
	return db.collection('activity_settings').findOneAsync({ 'userId': userId }).then((privacySettings) => {
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
   	return db.collection('activities').insertAsync(activity);
	});
}
exports.storeActivity = storeActivity;


/**
 * @desc: Creates an activity (to be called from POST)
 */
exports.create = function(req, res) {
	const type = req.body.type;
	const targetId = ObjectId(req.body.targetId);
	const userId = ObjectId(req.user._id);

   // Reject if user id is missing
   if(_.isEmpty(userId))
      return utils.rejectPromiseWithMessage(400, 'BAD_REQUEST');

   // Stores activity in database
   storeActivity(userId, type, targetId)
      .then(res.json.bind(res)).catch(utils.isOwnError, utils.handleOwnError(res));
};


exports.delete = function(req,res) {
	const actId = ObjectId(req.params.id);
	const userId = ObjectId(req.user._id);
	
	// FIXME: Why this? (comment from Carlo)
	db.collection('activities').findOneAsync({ '_id': actId }).then(function(activity) {
		return db.collection('activities').removeByIdAsync(activity._id)
			.then(res.json.bind(res));
	});
};
