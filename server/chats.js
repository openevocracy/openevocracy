// General libraries
const _ = require('underscore');
const Promise = require('bluebird');
const ObjectId = require('mongodb').ObjectID;
const db = require('./database').db;

// Own references
const C = require('../shared/constants').C;
const cfg = require('../shared/config').cfg;
const groups = require('./routes/groups');
const users = require('./routes/users');
const utils = require('./utils');
const mail = require('./mail');

// Rooms cache
let rooms = {};

/*
 * @desc: Function called via route from client in order to get information
 *        about a particular chat room, including past messages and user information.
 *
 * @params:
 *    req: request from client (contains chat room id)
 *    res: response to client
 */
exports.queryChatRoomMessages = function(req, res) {
	const groupId = ObjectId(req.params.id);
	const userId = ObjectId(req.user._id);
	
	// Get chat room id
	const chatRommId_promise = db.collection('groups')
		.findOneAsync({ '_id': groupId }, { 'chatRoomId': true })
		.then((group) => { return group.chatRoomId; });
		
	// Get extended users in chat room
	const extendedUsers_promise = extendUsersAsync(groupId);
	
	Promise.join(chatRommId_promise, extendedUsers_promise).spread((chatRoomId, extendedUsers) => {
		// Try to get room from cache, define user and prepare current timestamp
		let room = rooms[chatRoomId];
		const user = { 'userId': userId };
		const now = new Date().getTime();
		
		// Load chat room from either cache or database
		if (_.isUndefined(room)) {
			// Try to load the chat messages from database
			return db.collection('chat_messages')
				.find({'chatRoomId': chatRoomId}, { 'text': true, 'userId': true, 'type': true }).toArrayAsync()
				.then(function (messages) {
					if(_.isNull(messages)) {
						// Chat does not exist yet, create it in cache
						room = { 'messages': [], 'users': [user], 'cacheUpdate': now };
					} else {
						// Chat exists but it is not cached yet
						room = { 'messages': messages, 'users': [user], 'cacheUpdate': now };
					}
					rooms[chatRoomId] = room;
					
					return {
						'chatRoomId': chatRoomId,
						'messages': room.messages,
						'users': extendedUsers
					};
			});
		} else {
			// Update cache update time
			room.cacheUpdate = now;
			
			// Add current user to room, if not exists
			var existingUser = utils.findWhereObjectId(room.users, {'userId': userId});
			if (_.isUndefined(existingUser))	room.users.push(user);
			
			// Return room
			return Promise.resolve({
				'chatRoomId': chatRoomId,
				'messages': room.messages,
				'users': extendedUsers
			});
		}
	}).then(res.send.bind(res));
};

/**
 * @desc: Extend users by color, name and online status
 */
function extendUsersAsync(groupId) {
	// Get user color from databse
	return db.collection('group_relations')
		.find({ 'groupId': groupId }, { 'userId': true, 'userColor': true })
		.toArrayAsync().map((member) => {
			return { 
				'userId': member.userId,
				'color': member.userColor,
				'name': groups.helper.generateMemberName(groupId, member.userId)/*,
				'isOnline': users.isOnline(user.userId)*/
			};
	});
}

/*
 * @desc: Sends a message to all other clients in chatroom
 * @params:
 *    roomUsers: user of a particular chat room, contains userId's and sockets
 *    data: can either be a single message (object) or a collection of messages (array)
 */
function sendToSocketsInRoom(roomUsers, msg) {
	_.each(roomUsers, function(user) {
		// Send message to all users in rooom
		user.socket.send(JSON.stringify(msg), function(err) {
			if (!_.isUndefined(err))
				console.error(err);
		});
	});
}

/*
 * @desc: Remove a specific user from chat room
 */
function removeUserFromRoom(roomUsers, userId) {
	return _.reject(roomUsers, function(roomUser) {
		return utils.equalId(roomUser.userId, userId);
	});
}

/*
 * @desc:
 *    Reads/writes chat room from/to database/cache
 *    Sends incoming messages to all users in chat room
 *    Handles disconnecting users
 *
 * @params:
 *    socket: socket of currently connecting user
 *    chatRoomId: id of the chat room the user is part of
 *    userId: the id of the currently connecting user
 */
function joinChatRoom(socket, chatRoomId, userId) {
	var room = rooms[chatRoomId];
		
	// Add current user socket
	var user = utils.findWhereObjectId(room.users, {'userId': userId});
	user.socket = socket;
	
	// When socket receives a message
	socket.on('message', function(msg) {
		msg = JSON.parse(msg);
		
		// Create message id (to have timestamp of message)
		msg._id = ObjectId();
		// Append chat room id and user id
		msg.chatRoomId = ObjectId(chatRoomId);
		msg.userId  = userId;
		// Strip html tags
		msg.text = msg.text.replace(/(<([^>]+)>)/ig, '');
		
		// Save only default messages in cache/database
		if (msg.type == C.CHATMSG_DEFAULT) {
			// Save in cache
			room.messages.push(msg);
			// Save in database
			db.collection('chat_messages').insertAsync(msg);
		}
		
		// Send message to all users in room
		sendToSocketsInRoom(room.users, _.pick(msg, '_id', 'text', 'userId', 'type'));
	});
	
	// When socket disconnects
	socket.on('close', function() {
		// Remove user from room
		var remainingRoomUsers = removeUserFromRoom(room.users, userId);
	});
}

/*
 * @desc: Initializes chat socket connection
 * @params:
 *    wss: the ws socket
 */
exports.startChatServer = function(wss) {
	wss.on('connection', function(ws, req) {
		const vars = req.url.split("/socket/chat/")[1].split("/");
		const chatRoomId = vars[0];
		const userToken = vars[1];
		
		// Authenticate user and initialize sharedb afterwards
		users.socketAuthentication(ws, userToken, function(userId) {
			// Initialize chat
			joinChatRoom(ws, chatRoomId, userId);
			
			// Add userId to ws connection
			ws.userId = userId;
		});
		
		// Set socket alive initially and every time a pong is arriving
		/*ws.isAlive = true;
		ws.on('pong', function() {
			ws.isAlive = true;
		});*/
	});
	
	// Initalize ping interval
	//utils.pingInterval(wss);
};

exports.sendMailToMentionedUsers = function(req, res) {
	const groupId = ObjectId(req.body.groupId);
	const userIds = _.map(req.body.userIds, (userId) => { return ObjectId(userId) });
	const userId = ObjectId(req.user._id);
	
	db.collection('groups').findOneAsync({ '_id': groupId }, { 'name': true })
		.then((group) => {
			mail.sendMailToUserIds(userIds,
				'EMAIL_CHAT_MENTIONED_SUBJECT', [group.name],
				'EMAIL_CHAT_MENTIONED_MESSAGE', [cfg.PRIVATE.BASE_URL, groupId, group.name]);
	}).then(res.send.bind(res));
};
