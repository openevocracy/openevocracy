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
    conf
    ) {
    
    var Chat = {
        onShow: function(receiveMessageCallback) {
            // close connection if it already exits to avoid multiple connections
            if(this.chat_socket)
                this.chat_socket.disconnect();
            
            this.chat_socket = socketio.connect(conf.EVOCRACY_HOST, {secure: true});
            
            // this packet commands the server to initialize the chat
            this.chat_socket.emit('chat_identity', {'crid': this.model.get('crid')});
            
            this.chat_socket.on('messages', function(msgs) {
                _.each(msgs, function(msg) {
                    receiveMessageCallback(msg);
                });
            });
            
            this.chat_socket.on('message', function(msg) {
                receiveMessageCallback(msg);
            }.bind(this));
        },

        sendText: function(uid, text) {
            this.chat_socket.emit('message', {'uid': uid, 'text': text});
        },
        
        remove: function() {
        }
    };
    
    return Chat;
});