define([
    'jquery',
    'underscore',
    'Marionette',
    'socketio',
    'configs'
], function(
    $,
    _,
    Marionette,
    socketio,
    cfg) {
    
    var notificationSound = new Audio(cfg.EVOCRACY_HOST + "/snd/notification.mp3");
    
    var Chat = {
        onShow: function(receiveMessageCallback, notifyOnlineCallback, uid, uname) {
            // close connection if it already exits to avoid multiple connections
            if(this.chat_socket)
                this.chat_socket.disconnect();
            
            this.chat_socket = socketio.connect(cfg.EVOCRACY_HOST, {secure: true});
            
            // this packet commands the server to initialize the chat
            this.chat_socket.emit('chat_identity', {
                'crid': this.model.get('crid'),
                'uid': uid,
                'uname': uname
            });
            
            this.chat_socket.on('messages', function(msgs) {
                _.each(msgs, function(msg) {
                    receiveMessageCallback(msg);
                });
            });
            
            this.chat_socket.on('message', function(msg) {
                receiveMessageCallback(msg);
                
                // play notification if this is not our own message and is text
                if(msg.uid != App.session.user.get('_id') && !_.isUndefined(msg.text))
                    notificationSound.play();
            }.bind(this));
            
            this.chat_socket.on('online', function(users) {
                notifyOnlineCallback(users);
            }.bind(this));
        },

        sendText: function(text) {
            this.chat_socket.emit('message', {'text': text});
        },
        
        remove: function() {
            if(this.chat_socket) {
                this.chat_socket.disconnect();
                delete this.chat_socket;
            }
        }
    };
    
    return Chat;
});