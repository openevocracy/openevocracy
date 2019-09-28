// General libraries
const _ = require('underscore');
const Promise = require('bluebird');
const ObjectId = require('mongodb').ObjectID;

// Own references
const db = require('../../database').db;
const utils = require('../../utils');
const users = require('../users');
const groups = require('../groups');

// Cache variables
let badgeCache = [];

/*
 * @desc: Remove a specific user from badge cache
 */
function removeFromCache(userId, groupId) {
	return _.reject(badgeCache, (badgeStatus) => {
		return (utils.equalId(badgeStatus.userId, userId) && utils.equalId(badgeStatus.groupId, groupId));
	});
}

/**
 * @desc: Returns a specific user/group pair from cache
 */
function getFromCache(userId, groupId) {
	return badgeCache.filter((el) => {
		return utils.equalId(el.userId, userId) && utils.equalId(el.groupId, groupId);
	})[0];
}

/**
 * @desc: Load badge status from database
 */
function getBadgeStatusAsync(userId, groupId) {
	return db.collection('group_badges').findOneAsync({ 'userId': userId, 'groupId': groupId });
}
exports.getBadgeStatusAsync = getBadgeStatusAsync;


/**
 * @desc: Updates badge status in database
 */
function updateBadgeStatusAsync(userId, groupId, entity) {
	const query = { 'userId': userId, 'groupId': groupId };
	return db.collection('group_badges').updateAsync(query, { $set: entity }, { 'upsert': true });
}

/**
 * @desc: Increment badge status in database
 */
function incrementBadgeStatusAsync(userId, groupId, entity) {
	const query = { 'userId': userId, 'groupId': groupId };
	return db.collection('group_badges').updateAsync(query, { $inc: entity }, { 'upsert': true });
}

/**
 * @desc: Starts the socket server for toolbar badges
 */
exports.startGroupBadgeServer = function(wss) {
	wss.on('connection', function(ws, req) {
		const vars = req.url.split("/socket/badge/")[1].split("/");
		const groupId = ObjectId(vars[0]);
		const userToken = vars[1];
		
		// Authenticate user and initialize badge cache afterwards
		users.socketAuthentication(ws, userToken, function(userId) {
			// Add userId to ws connection
			ws.userId = userId;
			
			// Remove user/group pair from cache, if some exists
			badgeCache = removeFromCache(userId, groupId);
			
			// Load badge status from database and push it to cache
			getBadgeStatusAsync(userId, groupId).then((badge) => {
				// Add current badge socket to cache
				badge.socket = ws;
				
				// Push badge status to badge cache
				badgeCache.push(badge);
			});
			
			// When a message comes in
			ws.on('message', (badgeToUpdate) => {
				// Check values and store to database
				toolbarTabVisited(userId, groupId, badgeToUpdate);
			});
			
			// When socket disconnects
			ws.on('close', () => {
				// Remove user/group from badge cache
				badgeCache = removeFromCache(userId, groupId);
			});
		});
	});
};

/**
 * @desc: Update the editor badge in toolbar, every time a delta is sent from any member
 * @note: This function is called very often, when a member starts writing something,
 * 		 therefore, it is very important to reduce database operations as much as possible
 */
exports.updateEditorBadge = function(userId, pad) {
	// Get group and all members, but remove self
	const groupId = pad.groupId;
	const memberIds = utils.withoutObjectId(pad.ownerIds, userId);
	
	memberIds.forEach((memberId) => {
		// Try to load badge status from cache
		const badgeStatusFromCache = getFromCache(memberId, groupId);
		
		// If badge status is not in cache, add it to cache, to speed up the next function call
		let badgeStatus_promise = Promise.resolve(badgeStatusFromCache);
		if (!_.isUndefined(badgeStatusFromCache)) {
			badgeStatus_promise = getBadgeStatusAsync(userId, groupId).then((badge) => {
				// Push badge status to badge cache
				badgeCache.push(badge);
			});
		}
		
		badgeStatus_promise.then((badgeStatus) => {
			// If editorUnseen is already true, return here and save socket and hard disk
			if (badgeStatus.editorUnseen == 1)
				return;
			
			// If not, set editorUnseen to 1
			badgeStatus.editorUnseen = 1;
			
			// If socket is available on cached status, send message through socket
			if (!_.isUndefined(badgeStatus.socket)) {
				// Send socket message to each member of the group
				badgeStatus.socket.send(JSON.stringify({ 'editorUnseen': badgeStatus.editorUnseen }));
			}
			
			// Store new badge state in database
			updateBadgeStatusAsync(memberId, groupId, { 'editorUnseen': badgeStatus.editorUnseen });
		});
	});
};

/**
 * @desc: Update the chat badge in toolbar, every time a chat message comes in chat room
 */
exports.updateChatBadge = function(userId, chatRoomId) {
	db.collection('groups')
		.findOneAsync({ 'chatRoomId': chatRoomId }, { '_id': true }).then((group) => {
			const relations_promise = groups.helper.getGroupMembersAsync(group._id);
			return Promise.join(group._id, relations_promise);
	}).spread((groupId, relations) => {
		const allMemberIds = _.pluck(relations, 'userId');
		// Remove own user
		const memberIds = utils.withoutObjectId(allMemberIds, userId);
	
		memberIds.forEach((memberId) => {
			// Try to load badge status from cache
			const badgeStatus = getFromCache(memberId, groupId);
			
			// Add 1 to forumUnseen, if badgeStatus is available
			if (!_.isUndefined(badgeStatus))
				badgeStatus.chatUnseen += 1;
			
			// If socket is available, send message through socket
			if (!_.isUndefined(badgeStatus.socket)) {
				// Send socket message to each member of the group
				badgeStatus.socket.send(JSON.stringify({ 'chatUnseen': badgeStatus.chatUnseen }));
			}
			
			// Increment badge state in database
			incrementBadgeStatusAsync(memberId, groupId, { 'chatUnseen': 1 });
		});
	
	});
};

/**
 * @desc: Update the forum badge in toolbar, every time a post is created
 */
exports.updateForumBadge = function(userId, groupId) {
	groups.helper.getGroupMembersAsync(groupId).map((rel) => {
		// Don't send something, when member equals own user
		if (utils.equalId(rel.userId, userId))
			return;
		
		// Try to load badge status from cache
		const badgeStatus = getFromCache(rel.userId, groupId);
		
		// Add 1 to forumUnseen, if badgeStatus is available
		if (!_.isUndefined(badgeStatus))
			badgeStatus.forumUnseen += 1;
		
		// If socket is available, send message through socket
		if (!_.isUndefined(badgeStatus.socket)) {
			// Send socket message to each member of the group
			badgeStatus.socket.send(JSON.stringify({ 'forumUnseen': badgeStatus.forumUnseen }));
		}
		
		// Increment badge state in database
		incrementBadgeStatusAsync(rel.userId, groupId, { 'forumUnseen': 1 });
	});
};

/**
 * @desc: Update the members badge in toolbar, when group is created initially
 * @note: For every member in the group, the function is called seperately
 */
exports.updateMembersBadge = function(memberId, groupId) {
	// Just set value in database
	return updateBadgeStatusAsync(memberId, groupId, { 'membersUnseen': 1 });
};

/**
 * @desc: When a group member clicks on a tab (and has seen the new content),
 * 		 remove badge and reset values in database
 */
function toolbarTabVisited(userId, groupId, badgeToUpdate) {
	// Define condition to check values from client
	const check = ['editor', 'chat', 'forum', 'members'].includes(badgeToUpdate);
	
	// Actually check the conditions, if false, return
	if(!check) return;
	
	// Define key name
	const key = badgeToUpdate+'Unseen';
	
	// Load badge status from cache and update
	const badgeStatus = getFromCache(userId, groupId);
	badgeStatus[key] = 0;
	
	// Store value in database
	updateBadgeStatusAsync(userId, groupId, { [key]: 0 });
}

exports.sendUpdate = function() {
	
	
};
