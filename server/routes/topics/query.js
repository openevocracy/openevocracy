// General libraries
const _ = require('underscore');
const ObjectId = require('mongodb').ObjectID;
const Promise = require('bluebird');
const path = require('path');
const appRoot = require('app-root-path');

// Own references
const C = require('../../../shared/constants').C;
const db = require('../../database').db;
const utils = require('../../utils');
const activities = require('../activities');
const pads = require('../pads');
const manage = require('./manage');

/*
 * @desc: User votes for specific topic
 */
exports.vote = function(req, res) {
	// Transmitted topic vote
	var topic_vote = {
		'topicId': ObjectId(req.body.topicId),
		'userId': ObjectId(req.body.userId)
	};
	
	// Update the particular topic vote
	// If it already exists: Just update to the same (= do nothing)
	// If it does'nt exist: Insert
	db.collection('topic_votes')
		.updateAsync(topic_vote, topic_vote, {'upsert': true})
		.then(function(update_result) {
			// Add activity
			activities.addActivity(topic_vote.userId, C.ACT_TOPIC_VOTE, topic_vote.topicId);
			
			// Return voted value
			return { 'voted': true };
		}).then(res.json.bind(res));
};

/*
 * @desc: User unvotes for specific topic
 */
exports.unvote = function(req, res) {
	// Trasmitted topic vote
	var topic_vote = {
		'topicId': ObjectId(req.body.topicId),
		'userId': ObjectId(req.body.userId)
	};
    
	// Remove vote from database
	db.collection('topic_votes').removeAsync(topic_vote)
		.then(function(remove_result) {
			// Add activity
			activities.addActivity(topic_vote.userId, C.ACT_TOPIC_UNVOTE, topic_vote.topicId);
			
			// Return voted value
			return {'voted': false};
		}).then(res.json.bind(res));
};

/*
 * @desc: Download finished topic document
 */
exports.download = function(req, res) {
	var topicId = req.params.id;
	var filename = path.join(appRoot.path, 'files/documents', topicId+'.pdf');
	res.sendFile(filename);
};

/**
 * @desc: Manage topic state async, before calling topic view
 */
exports.basic = function(req, res) {
	var topicId = ObjectId(req.params.id);
	var userId = ObjectId(req.user._id);
	
	// Try to find topic and manage state
	db.collection('topics').findOneAsync({ '_id': topicId }).then((topic) => {
      return manage.manageTopicStateAsync(topic);
	}).then(function(topic) {
		// If no topic was found, reject, otherwise return topic
		if(_.isNull(topic))
			return utils.rejectPromiseWithAlert(404, 'danger', 'TOPIC_NOT_FOUND');
		else
			return topic;
   }).then((topic) => {
		// Try to find proposal of user
		return db.collection('pads_proposal')
			.findOneAsync({ 'topicId': topicId, 'authorId': userId }, { '_id': true })
			.then((proposal) => {
				return !_.isNull(proposal);
		}).then((hasProposal) => {
			return {
				'topicId': topic._id,
				'hasProposal': hasProposal,
				'stage': topic.stage,
				'nextDeadline': topic.nextDeadline
			};
		});
	}).then(res.json.bind(res)).catch(utils.isOwnError, utils.handleOwnError(res));
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
   	.findOneAsync({ 'topicId': topicId }, { 'authorId': true, 'docId': true })
   	.then(function(pad) {
   		// Add topic descrption html to pad
			return pads.addHtmlToPadAsync('topic_description', pad);
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
   			'authorId': descritpionPad.authorId,
   			'descHtml': descritpionPad.html,
   			'descDocId': descritpionPad.docId,
   			'descPadId': descritpionPad._id,
   			'voted': !_.isNull(voted),
   			'myGroupId': (_.isNull(myGroup) ? false : myGroup.groupId)
   		};
   }).then(res.json.bind(res));
};

/**
 * @desc: Updates a topic, can only be done by the author
 */
exports.update = function(req, res) {
    const topicId = ObjectId(req.params.id);
    const userId = ObjectId(req.user._id);
    const topicNew = req.body;
    
    db.collection('topics').findOneAsync({ '_id': topicId }).then(function(topic) {
        // only the authorId can update the topic
        if(!topic)
            return utils.rejectPromiseWithAlert(404, 'danger', 'TOPIC_NOT_FOUND');
        else if(!_.isEqual(topic.authorId,userId))
            return utils.rejectPromiseWithAlert(403, 'danger', 'TOPIC_NOT_AUTHORIZED_FOR_UPDATE');
        else if(topic.stage != C.STAGE_SELECTION)
            return utils.rejectPromiseWithAlert(403, 'danger', 'TOPIC_UPDATE_ONLY_IN_SELECTION_STAGE');
        
        return topic;
    }).then(function(topic) {
        topic.name = topicNew.name;
        return db.collection('topics').updateAsync(
                { '_id': topicId }, { $set: _.pick(topic,'name') }, {}).return(topic);
    }).then(manage.manageTopicStateAsync)
      .then(_.partial(manage.appendTopicInfoAsync, _, userId, true))
      .then(res.json.bind(res))
      .catch(utils.isOwnError, utils.handleOwnError(res));
};

/**
 * @desc: Creates new topic
 */
exports.create = function(req, res) {
	
	// Topic name is the only necessary request variable
	var data = req.body;
	var userId = ObjectId(req.user._id);
	var topic = {};
	topic.name = data.name;
	
	// Reject empty topic names
	if(_.isEmpty(topic.name)) {
		utils.sendAlert(res, 400, 'danger', 'TOPIC_NAME_EMPTY');
		return;
	}

	// Only allow new topics if they do not exist yet
	db.collection('topics').countAsync({'name': topic.name}).then(function(count) {
		// Topic already exists
		if(count > 0)
		   return utils.rejectPromiseWithAlert(409, 'danger', 'TOPIC_NAME_ALREADY_EXISTS');
		
		// Create topic
		topic._id = ObjectId();
		topic.authorId = ObjectId(req.user._id);
		topic.stage = C.STAGE_SELECTION; // start in selection stage
		topic.level = 0;
		topic.nextDeadline = manage.calculateDeadline(topic.stage);
		const create_topic_promise = db.collection('topics').insertAsync(topic);
		
		// Create pad
		var pad = { 'topicId': topic._id, 'authorId': userId, 'expiration': topic.nextDeadline };
		var create_pad_promise = pads.createPadAsync(pad, 'topic_description');
		
		// Add activity
		activities.addActivity(userId, C.ACT_TOPIC_CREATE, topic._id);
		
		return Promise.join(create_topic_promise, create_pad_promise).return(topic);
	}).then(function(topic) {
		topic.votes = 0;
		res.json(topic);
	}).catch(utils.isOwnError,utils.handleOwnError(res));
};

/**
 * @desc: Deletes a topic, can only be deleted by auhtor
 */
exports.delete = function(req,res) {
	const topicId = ObjectId(req.params.id);
	const userId = ObjectId(req.user._id);
	
	db.collection('topics').findOneAsync({ '_id': topicId }, { 'authorId': true, 'stage': true })
		.then(function(topic) {
			// only the author can delete the topic
			// and if the selection stage has passed, nobody can
			if(!_.isEqual(topic.authorId, userId) || topic.stage > C.STAGE_SELECTION)
				return utils.rejectPromiseWithAlert(401, 'danger', 'TOPIC_NOT_AUTHORISIZED_FOR_DELETION');
        
			return Promise.join(
				db.collection('topics').removeByIdAsync(topicId),
				db.collection('topic_votes').removeAsync({'topicId': topicId}),
				db.collection('groups').removeAsync({'tid': topicId}));
	}).then(res.sendStatus.bind(res, 200))
		.catch(utils.isOwnError,utils.handleOwnError(res));
};


/*
 * @desc: Get whole topiclist
 */
exports.getTopiclist = function(req, res) {
	const userId = ObjectId(req.user._id);
	
	manage.manageAndListTopicsAsync().then(function(topics) {
		// Promise.map does not work above
		Promise.map(topics, _.partial(manage.appendTopicInfoAsync, _, userId, false)).then(res.json.bind(res));
	}).catch(utils.isOwnError, utils.handleOwnError(res));
};
