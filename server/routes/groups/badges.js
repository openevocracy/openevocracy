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

exports.sendEditorUpdate = function(userId, pad) {
	// Get group and all members, but remove self
	const groupId = pad.groupId;
	const memberIds = utils.withoutObjectId(pad.ownerIds, userId);
	
	memberIds.forEach((memberId) => {
		// Try to load badge status from cache
		const badgeStatus = getFromCache(memberId, groupId);
		
		// If socket is available, send message through socket
		if (!_.isUndefined(badgeStatus.socket)) {
			// Send socket message to each member of the group
			badgeStatus.socket.send(JSON.stringify({ 'editorUnseen': 1 }));
		}
		
		// If badge is cached and editorUnseen is already true, return here and save hard disk
		if (!_.isUndefined(badgeStatus) && (badgeStatus.editorUnseen == 1))
			return;
		
		// Set editorUnseen to 1
		badgeStatus.editorUnseen = 1;
		// If previous condition is not met, store new badge state in database
		updateBadgeStatusAsync(memberId, groupId, { 'editorUnseen': 1 });
	});
};

function toolbarTabVisited(userId, groupId, badgeToUpdate) {
	// Define condition to check values from client
	const check = ['editor', 'chat', 'forum', 'members'].includes(badgeToUpdate);
	
	// Actually check the conditions, if false, return
	if(!check) return;
	
	// Define key name
	const key = badgeToUpdate+'Unseen';
	
	// Load badge status from cache and update
	const badgeStatus = getFromCache(userId, groupId);
	badgeStatus[key] = null;
	
	// Store value in database
	updateBadgeStatusAsync(userId, groupId, { [key]: null });
}

exports.manageGroupAction = function() {
	
};
