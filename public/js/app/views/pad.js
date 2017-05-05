define([
    'jquery',
    'underscore',
    'Marionette',
    'quill',
    'socketio',
    'configs'
], function(
    $,
    _,
    Marionette,
    Quill,
    socketio,
    conf
    ) {
    
    var Pad = {
        onShow: function(quill) {
            // close connection if it already exits to avoid multiple connections
            if(this.pad_socket) {
                console.log('disconnect');
                this.pad_socket.disconnect();
            }
            
            this.pad_socket = socketio.connect(conf.EVOCRACY_HOST, {secure: true});
            
            if(_.isUndefined(quill))
                this.editor = new Quill('#editor', { theme: 'snow' });
            else
                this.editor = quill;
            
            this.pad_socket.on('setContents', function(contents) {
                console.log('setContents');
                //console.log(JSON.stringify(contents));
                this.editor.setContents(contents);
            
                this.updateDocumentState();
            }.bind(this));
            
            this.pad_socket.on('change', function(change) {
                //console.log(JSON.stringify(change));
                this.editor.updateContents(change);
                
                this.updateDocumentState();
            }.bind(this));
            
            this.editor.on('text-change', function(delta, oldDelta, source) {
                if(source != 'user')
                    return;

                console.log('Editor contents have changed', JSON.stringify(delta));
                this.pad_socket.emit('change', delta);
                
                this.updateDocumentState();
            }.bind(this));
            
            // this packet commands the server to initialize the pad
            this.pad_socket.emit('pad_identity', {'pid': this.model.get('pid')});
        },
        
        updateDocumentState: function() {
            // count words
            var words = this.editor.getText().split(/\s+\b/).length;
            
            // calculate state
            // TODO store in config file
            var limits = {
                "simple": 0,
                "standard": 99,
                "advanced": 249,
                "excellent": 449,
                "superior": 699
            };
            
            var position = _.sortedIndex(_.values(limits), words);
            var state_curr = _.pairs(limits)[position-1];
            
            if(position < 5) {
                var state_next = _.pairs(limits)[position];
                $('.state-status').html('You reached ' + state_curr[0] + ' status.'
                    + '<br/><small>Write '+ (state_next[1]-words+1) + ' more words for ' + state_next[0] + ' status.</small>');
            } else {
                $('.state-status').html('Congrats, you reached ' + state_curr[0] + ' status.');
            }
            var stars = '';
            for(var i = 1; i <= 5; i++) {
                if(i <= position)
                    stars += '<i class="fa fa-star" aria-hidden="true"></i>';
                else
                    stars += '<i class="fa fa-star-o" aria-hidden="true"></i>';
            }
            $('.state-stars').html(stars);
        },
        
        remove: function() {
            $('.ql-toolbar').remove();
            $('#editor').empty().removeClass();
        }
    };
    
    return Pad;
});
