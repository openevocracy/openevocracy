// General libraries
const _ = require('underscore');
const ObjectId = require('mongodb').ObjectID;
const Promise = require('bluebird');

// Own references
const C = require('../../shared/constants').C;
const db = require('../database').db;
const utils = require('../utils');
const pads = require('./pads');

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
		return db.collection('pads_proposal').findOneAsync({ 'topicId': topicId, 'ownerId': userId }).then(function(pad) {
			if (_.isNull(pad)) {
				// If pad was not found, everyhting is correct and pad can be created
				pad = { 'expiration': topic.nextDeadline, 'topicId': topicId, 'ownerId': userId };
				return pads.createPadAsync(pad, 'proposal').then(function(pad) {
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
