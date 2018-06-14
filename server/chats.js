// General libraries
var _ = require('underscore');
var ObjectId = require('mongodb').ObjectID;
var db = require('./database').db;

// Own references
var users = require('./routes/users');

// rooms cache
var rooms = {};

/*
 * @desc: sends a message to all other clients in chatroom
 * @params:
 *    roomUsers: user of a particular chat room, contains userId's and sockets
 *    data: can either be a single message (object) or a collection of messages (array)
 */
function sendToSocketsInRoom(roomUsers, data) {
	_.each(roomUsers, function(user) {
		// Send message to all users in rooom
		user.socket.send(JSON.stringify(data));
	});
}

/*
 * @desc: remove a specific user from chat room
 */
function removeUserFromRoom(roomUsers, userId) {
	return _.reject(roomUsers, function(user) {
		return (user.id.toString() == userId.toString());
	});
}

/*
 * @desc:
 *    Reads/writes chat room from/to database/cache
 *    Sends incoming messages to all users in chat room
 *    Handles disconnecting users
 * @params:
 *    socket: socket of currently connecting user
 *    chatRoomId: id of the chat room the user is part of
 *    userId: the id of the currently connecting user
 */
function joinChatRoom(socket, chatRoomId, userId) {
	// Load chat room from either cache or database
	var initRoom_promise;
	var room = rooms[chatRoomId];
	if (_.isUndefined(room)) {
		// Try to load the chat messages from database
		initRoom_promise = db.collection('chat_messages')
			.find({'chatRoomId': ObjectId(chatRoomId)}, {'chatRoomId': false}).toArrayAsync()
			.then(function (messages) {
				if(_.isNull(messages)) {
					// Chat does not exist yet, create it in cache
					room = { 'messages': [], 'users': [] };
				} else {
					// Chat exists but it is not cached yet
					room = { 'messages': messages, 'users': [] };
				}
				return (rooms[chatRoomId] = room);
		});
	} else {
		initRoom_promise = Promise.resolve(room);
	}
	
	// Add current user to chat room and transmit all former messages to the user
	initRoom_promise.then(function(room) {
		// If user is already part of the room, remove old entry
		var oldUser = _.findWhere(room.users, {'id': userId});
		if (!_.isUndefined(oldUser)) {
			room.users = removeUserFromRoom(room.users, oldUser.id);
		}
		
		// Add userId and user socket to users list in that particular chat room
		room.users.push({
			'id': userId,
			'socket': socket
		});
		
		// Send all messages to socket if there are any
		if (_.size(room.messages) != 0)
			socket.send(JSON.stringify(room.messages));
	});
	
	// When socket receives a message
	socket.on('message', function(msg) {
		console.log(msg);
		msg = JSON.parse(msg);
		// Append message attributes
		msg.messageId  = ObjectId();
		msg.chatRoomId = ObjectId(chatRoomId);
		msg.userId  = userId;
		// Strip html tags
		msg.text = msg.text.replace(/(<([^>]+)>)/ig, '');
		
		// Save in cache
		rooms[chatRoomId].messages.push(msg);
		// Save in database
		db.collection('chat_messages').insertAsync(msg);
		// Send message to all users in room
		sendToSocketsInRoom(room.users, msg);
	});
    
	// When socket disconnects
	socket.on('close', function() {
		var room = rooms[chatRoomId];
		
		// Remove user from room
		var users = removeUserFromRoom(room.users, userId);
		
		// Remove whole room from cache if no more user is present
		if(_.isEmpty(users))
			delete rooms[chatRoomId];
			
		// TODO this solution is not optimal (deleting the group from cache)
		// if only one user is active in the group and changes the view quite often,
		// the whole chat room is removed from cache and has to be loaded from database all the time
		// maybe add a cache expiration timestamp, which is renewed when a user is back in chat room again
		// (analog to group inactivity email reminder)
	});
}

/*
 * @desc: Initializes chat socket connection
 * @params:
 *    wss: the ws socket
 */
exports.startChatServer = function(wss) {
	wss.on('connection', function(ws, req) {
		var vars = req.url.split("/socket/chat/")[1].split("/");
		var chatRoomId = vars[0];
		var userToken = vars[1];
		
		// Authenticate user and initialize sharedb afterwards
		users.socketAuthentication(ws, userToken, function(userId) {
			// Initialize chat
			joinChatRoom(ws, chatRoomId, userId);
		});
	});
};
