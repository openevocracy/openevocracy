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
        onShow: function() {
            // close connection if it already exits to avoid multiple connections
            if(this.socket)
                this.socket.disconnect();
            
            this.socket = socketio.connect(conf.EVOCRACY_HOST, {secure: true});
        },

        remove: function() {
        }
    }
    
    return Chat;
});