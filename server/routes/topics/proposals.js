// General libraries
const _ = require('underscore');
const ObjectId = require('mongodb').ObjectID;
const Promise = require('bluebird');

// Own references
const C = require('../../../shared/constants').C;
const db = require('../../database').db;
const utils = require('../../utils');
const pads = require('../pads');
const activities = require('../activities');

/*
 * @desc: Create new proposal
 */
exports.create = function(req, res) {
	const topicId = ObjectId(req.body.topicId);
	const userId = ObjectId(req.body.userId);
	
	db.collection('topics').findOneAsync({ '_id': topicId }).then(function(topic) {
		// Check if topic is at least in proposal stage to create proposal
		if(topic.stage < C.STAGE_PROPOSAL)
		   return utils.rejectPromiseWithAlert(400, 'danger', 'TOPIC_REQUIREMENT_PROPOSAL_STAGE');
		return topic;
	}).then(function(topic) {
		// Check if pad already exists, if not, create
		return db.collection('pads_proposal').findOneAsync({ 'topicId': topicId, 'authorId': userId }).then(function(pad) {
			if (_.isNull(pad)) {
				// If pad was not found, everyhting is correct and pad can be created
				pad = { 'expiration': topic.nextDeadline, 'topicId': topicId, 'authorId': userId };
				return pads.createPadAsync(pad, 'proposal').then(function(pad) {
					
					// Add activity
					activities.addActivityAsync(userId, C.ACT_PROPOSAL_CREATED, topicId);
					
					// Send success to client
					utils.sendAlert(res, 200, 'success', 'TOPIC_PROPOSAL_ALERT_CREATED');
					return;
				});
			} else {
				// If pad was found, something went wrong, sent alert
				utils.sendAlert(res, 400, 'danger', 'TOPIC_PROPOSAL_ALREADY_EXISTS');
				return;
			}
		});
	}).catch(utils.isOwnError, utils.handleOwnError(res));
};

/**
 * @desc: Get topic proposal document information and html snapshot
 */
exports.query = function(req, res) {
	var topicId = ObjectId(req.params.id);
   var userId = ObjectId(req.user._id);
   
   // Get proposal pad data
   db.collection('pads_proposal')
   	.findOneAsync({ 'topicId': topicId, 'authorId': userId }, { '_id': true, 'docId': true, 'authorId': true })
   	.then((pad) => {
   		if (_.isNull(pad))
   			return utils.rejectPromiseWithAlert(404, 'danger', 'PAD_NOT_FOUND');
   		// Extend pad by html snapshot and return whole pad
   		return pads.addHtmlToPadAsync('proposal', pad);
   }).then(res.json.bind(res)).catch(utils.isOwnError, utils.handleOwnError(res));
};
