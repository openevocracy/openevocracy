// General libraries
const _ = require('underscore');
const ObjectId = require('mongodb').ObjectID;
const Promise = require('bluebird');

// Own references
const db = require('../../database').db;
const utils = require('../../utils');
const pads = require('../pads');
const manage = require('./manage');

/**
 * @desc: Manage topic state async, before calling topic view
 */
exports.basic = function(req, res) {
	var topicId = ObjectId(req.params.id);
	var userId = ObjectId(req.user._id);
	
	// Try to find topic and manage state
	const manageTopic_promise = db.collection('topics').findOneAsync({ '_id': topicId })
      .then(manage.manageTopicStateAsync)
      .then(function(topic) {
      	// If no topic was found, reject, otherwise return true
         if(_.isNull(topic))
            return utils.rejectPromiseWithAlert(404, 'danger', 'TOPIC_NOT_FOUND');
         else
            return true;
   }).catch(utils.isOwnError, utils.handleOwnError(res));
   
   manageTopic_promise.then((wasManaged) => {
		if (!wasManaged)
			return;
		
		// Try to find proposal of user
		const hasProposal_promise = db.collection('pads_proposal')
			.findOneAsync({ 'topicId': topicId, 'ownerId': userId }, { '_id': true })
			.then((proposal) => {
				return !_.isNull(proposal);
		});
      
		// Get stage from topic
		const topic_promise = db.collection('topics')
			.findOneAsync({ '_id': topicId }, { 'stage': true });
      	
      
		return Promise.join(hasProposal_promise, topic_promise)
			.spread((hasProposal, topic) => {
				return {
					'topicId': topicId,
					'hasProposal': hasProposal,
					'stage': topic.stage
				};
			});
		}).then(res.json.bind(res));
};

/**
 * @desc: Get all necessary data for the upper toolbar in topics view
 */
exports.toolbar = function(req, res) {
   var topicId = ObjectId(req.params.id);
   
   db.collection('topics').findOneAsync({ '_id': topicId }).then((topic) => {
   	return {
   		'_id': topic._id,
   		'name': topic.name,
   		'nextDeadline': topic.nextDeadline
   	};
   }).then(res.json.bind(res));
};

/**
 * @desc: Get data for topic overview
 */
exports.overview = function(req, res) {
   var topicId = ObjectId(req.params.id);
   var userId = ObjectId(req.user._id);
   
   // Get author, docId and html of description
   const descriptionPad_promise = db.collection('pads_topic_description')
   	.findOneAsync({ 'topicId': topicId }, { 'ownerId': true, 'docId': true })
   	.then(function(pad) {
   		// Add topic descrption html to pad
			return pads.addHtmlToPad('topic_description', pad);
	});
	
	// Get voted status of current user
   const voted_promise = db.collection('topic_votes')
   	.findOneAsync({ 'topicId': topicId, 'userId': userId });
   	
   // Get some things from topic
   const topic_promise = db.collection('topics')
   	.findOneAsync({ '_id': topicId }, { 'level': true });
   
   // Get groupId for group where user is currently in
   const myGroup_promise = topic_promise.then((topic) => {
		// Get all groups with current topic level
		return db.collection('groups')
			.find({ 'topicId': topicId, 'level': topic.level }, { '_id': true }).toArrayAsync()
			.then((groupsCurrentLevel) => {
				// Get array of all groupIds (where groups are in current topic level)
				const groupIds = _.pluck(groupsCurrentLevel, '_id');
				// Search for group (in current level) where user is member
				return db.collection('group_relations')
					.findOneAsync({ 'userId': userId, 'groupId': { '$in': groupIds } }, { 'groupId': true });
		});
   });
   
   // Join promises and return result
   Promise.join(descriptionPad_promise, voted_promise, topic_promise, myGroup_promise)
   	.spread((descritpionPad, voted, topic, myGroup) => {
   		return {
   			'authorId': descritpionPad.ownerId,
   			'descHtml': descritpionPad.html,
   			'descDocId': descritpionPad.docId,
   			'descPadId': descritpionPad._id,
   			'voted': !_.isNull(voted),
   			'myGroupId': (_.isNull(myGroup) ? false : myGroup.groupId)
   		};
   }).then(res.json.bind(res));
};
