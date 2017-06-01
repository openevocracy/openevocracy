define([
    'jquery',
    'underscore',
    'Marionette',
    'quill',
    'socketio',
    'configs',
    '../utils'
], function(
    $,
    _,
    Marionette,
    Quill,
    socketio,
    conf,
    u
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
            // Count words
            var words = this.editor.getText().split(/\s+\b/).length;
            
            // Define states
            var limits = [
                { 'limit': 0, 'name': u.i18n('simple') },
                { 'limit': 99, 'name': u.i18n('standard') },
                { 'limit': 249, 'name': u.i18n('advanced') },
                { 'limit': 449, 'name': u.i18n('excellent') },
                { 'limit': 699, 'name': u.i18n('superior') }
            ];
            
            var position = _.sortedIndex(limits, {'limit': words}, 'limit');
            var state_curr = limits[position-1];
            
            // Set text
            if(position < 5) {
                var state_next = limits[position];
                var status_next = u.strformat(u.i18n('Write {0} more words for {1} status.'), state_next.limit-words+1, state_next.name);
                $('.state-status').html(state_curr.name);
                $('.state-next').html(status_next);
            } else {
                $('.state-status').html(u.strformat(u.i18n('Congrats, you reached {0} status.'), state_curr.name));
            }
            
            // Set stars
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
