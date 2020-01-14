// General libraries
const _ = require('underscore');
const ObjectId = require('mongodb').ObjectID;

// Own references
const C = require('../../../shared/constants').C;
const db = require('../../database').db;
const utils = require('../../utils');
const pads = require('../pads');

/*
 * @desc: Create new proposal
 */
exports.create = async function(req, res) {
	const topicId = ObjectId(req.body.topicId);
	const userId = ObjectId(req.body.userId);
	
	const topic = await db.collection('topics').findOneAsync({ '_id': topicId });
	
	// Check if topic is at least in proposal stage to create proposal
	if(topic && topic.stage < C.STAGE_PROPOSAL) {
		return utils.sendAlert(res, 400, 'danger', 'TOPIC_REQUIREMENT_PROPOSAL_STAGE');
	}
		
	// Check if pad already exists, if not, create
	let pad = await db.collection('pads_proposal').findOneAsync({ 'topicId': topicId, 'ownerId': userId });
	
	if (_.isNull(pad)) {
		// If pad was not found, everyhting is correct and pad can be created
		pad = { 'expiration': topic.nextDeadline, 'topicId': topicId, 'ownerId': userId };
		pad = pads.createPadAsync(pad, 'proposal');
		return utils.sendAlert(res, 200, 'success', 'TOPIC_PROPOSAL_ALERT_CREATED');
	} else {
		// If pad was found, something went wrong, sent alert
		return utils.sendAlert(res, 400, 'danger', 'TOPIC_PROPOSAL_ALREADY_EXISTS');
	}
};
