var _ = require('underscore');
var ObjectId = require('mongodb').ObjectID;
var db = require('./database').db;

var rooms = {};

function sendToSocketsInRoom(type, room, msg) {
    _.each(room.sockets, function(other) {
        // send message to all other users
        other.emit(type, msg);
    });
}

function joinChatRoom(socket, crid, uid, uname) {
    // initialize chat
    var initRoomPromise;
    var room = rooms[crid];
    if(_.isUndefined(room)) {
        // try to load the chat messages from database
        initRoomPromise = db.collection('chat_messages').
        find({'crid': crid}, {'crid': false}).
        toArrayAsync().then(function (messages) {
            if(_.isNull(messages)) {
                // chat does not exist yet, create it in cache
                room = {'messages': [], 'sockets': [], 'users': []};
            } else {
                // chat exists but it is not cached yet
                room = {'messages': messages, 'sockets': [], 'users': []};
            }
            
            return (rooms[crid] = room);
        });
    } else
        initRoomPromise = Promise.resolve(room);
    
    // initialize socket
    initRoomPromise.then(function(room) {
        // add socket to room
        room.sockets.push(socket);
        // add user to room
        room.users.push(uid);
        
        // send all messages to socket if there are any
        if(0 != _.size(room.messages))
            socket.emit('messages', room.messages);
        
        // notify about changed user online status in room
        sendToSocketsInRoom('online', room, room.users);
        // send message to other sockets in room
        sendToSocketsInRoom('message', room, {'info': '{0} entered the chat room.', 'arg': uname});
    });
    
    // when socket receives a message
    socket.on('message', function(msg) {
        // append message attributes
        msg._id  = ObjectId();
        msg.crid = crid;
        msg.uid  = uid;
        // strip html tags
        msg.text = msg.text.replace(/(<([^>]+)>)/ig, '');
        
        // save in cache
        rooms[crid].messages.push(msg);
        // save in database
        db.collection('chat_messages').insertAsync(msg);
        // send message to other sockets in room
        sendToSocketsInRoom('message', room, msg);
    });
    
    // when socket disconnects
    socket.on('disconnect', function() {
        var room = rooms[crid];
        if(_.isUndefined(room))
            return;
        
        // remove socket from room
        room.sockets.splice(room.sockets.indexOf(socket), 1);
        // remove user from room
        room.users.splice(room.users.indexOf(uid), 1);
        // remove room from cache if no more sockets present
        if(_.isEmpty(room.sockets))
            delete rooms[crid];
        // notify about changed user online status in room
        sendToSocketsInRoom('online', room, room.users);
        // notify with info
        sendToSocketsInRoom('message', room, {'info': '{0} left the chat room.', 'arg': uname});
    });
}

exports.startChatServer = function(io) {
    io.on('connection', function(socket) {
        socket.on('chat_identity', function(identity) {
            joinChatRoom(socket, identity.crid, identity.uid, identity.uname);
        });
    });
};