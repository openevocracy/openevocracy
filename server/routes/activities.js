var _ = require('underscore');
var db = require('../database').db;
var ObjectId = require('mongodb').ObjectID;
var Promise = require('bluebird');
//var requirejs = require('requirejs');
var fs = Promise.promisifyAll(require('fs'));
var path = require('path');
var appRoot = require('app-root-path');
var AsyncLock = require('async-lock');
var lock = new AsyncLock();

var C = require('../../shared/constants').C;
//var cfg = requirejs('public/js/setup/configs');
var cfg = require('../../shared/config').cfg;
var groups = require('./groups');
var pads = require('./pads');
var utils = require('../utils');
var mail = require('../mail');

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
	manageAndListActivitiesAsync({ 'userId': req.user._id }).then(res.json.bind(res));
};

/*
 * @desc: Get whole activity list
 */
exports.getActivityList = function(req, res) {
	manageAndListActivitiesAsync().then(res.json.bind(res));
};

exports.query = function(req, res) {
   var activityId = ObjectId(req.activityId);
   var userId = ObjectId(req.userId);
   
   db.collection('activities').findOneAsync({ '_id': activityId })
      .then(function(act) {
         if(_.isNull(act))
            return utils.rejectPromiseWithAlert(404, 'danger', 'ACTIVITY_NOT_FOUND');
         else
            return act;
      }).then(res.json.bind(res))
      .catch(utils.isOwnError, utils.handleOwnError(res));
};


// Actually creates an activity in the database
function actcreate(_userId, _type, _targetId, res) {
   // Create activity
   const activity = {
      _id: ObjectId(),
      userId: _userId,
	   type: _type,
	   targetId: _targetId
   };
   
   db.collection('activities').insertAsync(activity).then(res.json.bind(res));
};
exports.actcreate = actcreate;


// Creates an activity (to be called from POST)
exports.create = function(req, res) {

   // reject if user ID is missing
   if(_.isEmpty(req.user._id)) {
      utils.sendAlert(res, 400, 'danger', 'USER_ID_EMPTY');
      return;
   }

   
   actcreate(req.user._id, req.body.type, req.body.targetId, res);
};


exports.delete = function(req,res) {
    var actId = ObjectId(req.params.id);
    var uid = ObjectId(req.user._id);

    db.collection('activities').findOneAsync({ '_id': actId })
      .then(function(activity) {
         return db.collection('activities').removeByIdAsync(activity._id )
                .then(res.json.bind(res))
                .catch(utils.isOwnError,utils.handleOwnError(res));
       });
};
