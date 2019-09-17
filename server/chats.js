// General libraries
var _ = require('underscore');
var C = require('../shared/constants').C;
var ObjectId = require('mongodb').ObjectID;
var db = require('./database').db;

// Own references
var users = require('./routes/users');
var utils = require('./utils');

// Rooms cache
var rooms = {};

/*
 * @desc: Function called via route from client in order to get information
 *        about a particular chat room, including past messages and user information.
 *
 * @params:
 *    req: request from client (contains chat room id)
 *    res: response to client
 */
exports.getChatRoomMessages = function(req, res) {
	var chatRoomId = ObjectId(req.params.id);
	var userId = ObjectId(req.user._id);
	
	// Try to get room from cache, define user and prepare current timestamp
	var room = rooms[chatRoomId];
	var user = {'userId': userId};
	var now = new Date().getTime();
	
	// Load chat room from either cache or database
	var chatRoom_promise = null;
	if (_.isUndefined(room)) {
		// Try to load the chat messages from database
		chatRoom_promise = db.collection('chat_messages')
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
				return room;
		});
	} else {
		// Update cache update time
		room.cacheUpdate = now;
		
		// Add current user to room, if not exists
		var existingUser = utils.findWhereObjectId(room.users, {'userId': userId});
		if (_.isUndefined(existingUser))	room.users.push(user);
		
		// Return room
		chatRoom_promise = Promise.resolve({
			'messages': room.messages,
			'users': _.pluck(room.users, 'userId')
		});
	}
	
	chatRoom_promise.then(res.send.bind(res));
};

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
		return (roomUser.userId.toString() == userId.toString());
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
