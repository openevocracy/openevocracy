// General libraries
const _ = require('underscore');
const Promise = require('bluebird');
const ObjectId = require('mongodb').ObjectID;

// Own references
const db = require('../../database').db;
const utils = require('../../utils');
const users = require('../utils');

// Cache variables
let badgeCache = [];

/*
 * @desc: Remove a specific user from badge cache
 */
function removeUserFromCache(roomUsers, userId) {
	return _.reject(badgeCache, (badge) => {
		return utils.findWhereObjectId(badge.userId, userId);
	});
}

/**
 * @desc: Load badge status from database
 */
function getBadgeStatusAsync(userId, groupId) {
	return db.collection('group_badges').findOneAsync({ 'userId': userId, 'groupId': groupId });
}
exports.getBadgeStatusAsync = getBadgeStatusAsync;

exports.startGroupBadgeServer = function(wss) {
	wss.on('connection', function(ws, req) {
		const vars = req.url.split("/socket/badge/")[1].split("/");
		const groupId = ObjectId(vars[0]);
		const userToken = vars[1];
		
		// Authenticate user and initialize badge cache afterwards
		users.socketAuthentication(ws, userToken, function(userId) {
			const query = { 'userId': userId, 'groupId': groupId };
			let badgeStatus =  utils.findWhereObjectId(badgeCache, query);
			
			// If badge status was not found in cache, load it from database and push it to cache
			if (!badgeStatus) {
				badgeStatus = Promise.resolve(getBadgeStatusAsync(userId, groupId));
				badgeCache.push(badgeStatus);
			}
			
			// Add current badge socket to cache
			badgeStatus.socket = ws;
					
			// Add userId to ws connection
			ws.userId = userId;
			
			// When socket disconnects
			ws.on('close', function() {
				// Remove user/group from badge cache
				delete utils.findWhereObjectId(badgeCache, query);
			});
		});
	});
};

exports.sendEditorUpdate = function(userId, pad) {
	
	console.log('editor update', pad);
	
	// Get group and all members
	const groupId = pad.groupId;
	const memberIds = utils.withoutObjectId(pad.ownerIds, userId);
	
	memberIds.forEach((memberId) => {
		const query = { 'userId': memberId, 'groupId': groupId };
		
		// Try to load badge status from cache
		const badgeStatus = utils.findWhereObjectId(badgeCache, query);
		// If socket is available, send message through socket
		if (badgeStatus && badgeStatus.socket) {
			// Send socket message to all members of the group
			// FIXME: Don't send to current user, instead: send to all other users, requires to update cache
			badgeStatus.socket.send(JSON.stringify({ 'editorUpdated': true }), (err) => {
				if (!_.isUndefined(err))
					console.error(err);
			});
		}
		
		// If badge is cached and editorUpdated is already true, return here and save hard disk
		if (badgeStatus && badgeStatus.editorUpdated)
			return;
		
		// If previous condition is not met, first check if user is part of the group
		db.collection('group_badges').updateAsync(query, { ...query, 'editorUpdated': true }, { 'upsert': true });
	});
};

exports.manageGroupAction = function() {
	
};
