var _ = require('underscore');
var db = require('./database').db;

var rooms = {};

function sendMessageToSocketsInRoom(room, socket, msg) {
    _.each(room.sockets, function(other) {
        // send message to all other users
        other.emit('message', msg);
    });
}

function joinChatRoom(socket, crid) {
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
                room = {'messages': [], 'sockets': []};
            } else {
                // chat exists but it is not cached yet
                room = {'messages': messages, 'sockets': []};
            }
            
            return (rooms[crid] = room);
        });
    } else
        initRoomPromise = Promise.resolve(room);
    
    // initialize socket
    initRoomPromise.then(function(room) {
        // add socket to chat
        room.sockets.push(socket);
        
        // send all messages to socket if there are any
        if(0 != _.size(room.messages))
            socket.emit('messages', room.messages);
    });
    
    // when socket receives a message
    socket.on('message', function(msg) {
        msg.text = msg.text.replace(/(<([^>]+)>)/ig, '');
        // save in cache
        rooms[crid].messages.push(msg);
        // save in database
        db.collection('chat_messages').insertAsync(_.extend(msg, {'crid': crid}));
        // send message to other sockets in room
        sendMessageToSocketsInRoom(room, socket, msg);
    });
    
    // when socket disconnects
    socket.on('disconnect', function() {
        var room = rooms[crid];
        if(_.isUndefined(room))
            return;
        
        // remove socket from room
        room.sockets.splice(room.sockets.indexOf(socket), 1);
        // notify other sockets
        sendMessageToSocketsInRoom(room, socket, {'info': 'somebody left the chat room'}); // FIXME get user id
    });
}

exports.startChatServer = function(io) {
    io.on('connection', function(socket) {
        socket.on('chat_identity', function(identity) {
            joinChatRoom(socket, identity.crid);
        });
    });
};