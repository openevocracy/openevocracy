// General libraries
var _ = require('underscore');
var db = require('../database').db;
var ObjectId = require('mongodb').ObjectID;
var Promise = require('bluebird');

// Own references
var utils = require('../utils');

/**
 * gets all activities from database that satisfy the filter
 * - filter: a JSON object specifying what is queried
 * 
 * @return {object} topics - all adjusted topics
 */
function manageAndListActivitiesAsync(filter) {
	return db.collection('activities').find(filter).toArrayAsync();
}
exports.manageAndListActivitiesAsync = manageAndListActivitiesAsync;

/*
 * @desc: Get whole activity list of a particular user
 */
exports.getUserActivityList = function(req, res) {
   const userId = ObjectId(req.params.id);
	manageAndListActivitiesAsync({ 'userId': userId }).then(res.json.bind(res));
};

/*
 * @desc: Get whole activity list
 */
exports.getActivityList = function(req, res) {
	manageAndListActivitiesAsync().then(res.json.bind(res));
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
function storeActivity(_userId, _type, _targetId) {
   // Define activity object
   const activity = {
      _id: ObjectId(),
      userId: _userId,
	   type: _type,
	   targetId: _targetId
   };
   
   // Adds object to database
   return db.collection('activities').insertAsync(activity);
}
exports.storeActivity = storeActivity;


/**
 * @desc: Creates an activity (to be called from POST)
 */
exports.create = function(req, res) {

   // Reject if user id is missing
   if(_.isEmpty(req.user._id))
      return utils.rejectPromiseWithMessage(400, 'BAD_REQUEST');

   // Stores activity in database
   storeActivity(req.user._id, req.body.type, req.body.targetId)
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
