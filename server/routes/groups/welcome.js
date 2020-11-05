// General libraries
const _ = require('underscore');
const Promise = require('bluebird');
const ObjectId = require('mongodb').ObjectID;

// Own references
const db = require('../../database').db;
const helper = require('./helper');

/**
 * @desc: Get welcome dialog status (already opened or not)
 */
exports.getWelcomeStatus = function(req, res) {
	const groupId = ObjectId(req.params.id);
	const userId = ObjectId(req.user._id);
	
	// Search for userId/groupId combination
	db.collection('group_welcome').findOneAsync(
		{ 'groupId': groupId, 'userId': userId }
	).then((welcomeStatus) => {
		// If nothing was found, alreadyShown is false, otherwise true
		return { 'alreadyShown': !_.isNull(welcomeStatus) };
	}).then(res.json.bind(res));
};

/**
 * @desc: Set welcome dialog status (already opened or not)
 */
exports.setWelcomeStatus = function(req, res) {
	const groupId = ObjectId(req.body.groupId);
	const userId = ObjectId(req.user._id);
	
	// Store userId/groupId combination
	db.collection('group_welcome').insertAsync(
		{ 'groupId': groupId, 'userId': userId }
	).then(res.json.bind(res));
};

/**
 * @desc: Get all information about group welcome dialog
 */
exports.getWelcomeData = function(req, res) {
	const groupId = ObjectId(req.params.id);
	const userId = ObjectId(req.user._id);
	
	// Get member name
	const memberName_promise = helper.getGroupUserNameAsync(groupId, userId);
	
	// Get group name
	const group_promise = db.collection('groups').findOneAsync(
		{ '_id': groupId }, { 'name': true, 'topicId': true }
	);
	
	// Get topic name
	const topicName_promise = group_promise.then((group) => {
		return db.collection('topics')
			.findOneAsync({ '_id': group.topicId }, { 'name': true }).get('name');	
	});
	
	// Return result
	Promise.join(group_promise, topicName_promise, memberName_promise).spread((group, topicName, memberName) => {
		return {
			'memberName': memberName,
			'groupName': group.name,
			'topicName': topicName
		};
	}).then(res.json.bind(res));
};
