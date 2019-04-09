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
 * gets all topics from database, call management of topic states and retun all topics
 * 
 * @return {object} topics - all adjusted topics
 */
function manageAndListActivitiesAsync() {
	return lock.acquire('manageActivity', function() {
		return db.collection('activities').find().toArrayAsync();
	});
}
exports.manageAndListActivitiesAsync = manageAndListActivitiesAsync;

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

exports.create = function(req, res) {

   // reject if user ID is missing
   if(_.isEmpty(req.user._id)) {
      utils.sendAlert(res, 400, 'danger', 'USER_ID_EMPTY');
      return;
   }

   // Create activity
   const activity = {
      _id: ObjectId(),
      userId: req.user._id,
	   type: req.body.type,
	   targetId: req.body.targetId
   };
   	
   db.collection('activities').insertAsync(activity).then(function(activity) {
      res.json(activity);
   }).catch(utils.isOwnError,utils.handleOwnError(res));
};

//TODO:
exports.delete = function(req,res) {
    var topicId = ObjectId(req.params.id);
    var uid = ObjectId(req.user._id);
    
    db.collection('topics').findOneAsync({ '_id': topicId }, { 'owner': true, 'stage': true })
    .then(function(topic) {
        // only the owner can delete the topic
        // and if the selection stage has passed, nobody can
        if(!_.isEqual(topic.owner,uid) || topic.stage > C.STAGE_SELECTION)
            return utils.rejectPromiseWithAlert(401, 'danger', 'TOPIC_NOT_AUTHORIZED_FOR_DELETION');
        
        return Promise.join(
            db.collection('topics').removeByIdAsync(topicId),
            db.collection('topic_votes').removeAsync({'topicId': topicId}),
            db.collection('groups').removeAsync({'tid': topicId}));
    }).then(res.sendStatus.bind(res,200))
      .catch(utils.isOwnError,utils.handleOwnError(res));
};
