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
    cfg,
    u
    ) {
    
    function Pad(pid, quill, conf) {
        
        this.activateEdit = function() {
            $('#editor').removeClass('not-available');
            $('#editor .ql-editor').attr('contenteditable', 'true').fadeIn(500);
            $('#editor .editor-reason').remove();
        };
        
        this.deactivateEdit = function(reason) {
            $('#editor').addClass('not-available');
            $('#editor .ql-editor').attr('contenteditable', 'false').hide();
            
            if(!_.isUndefined(reason))
                $('#editor').append('<p class="editor-reason"><em>'+ reason +'</em></p>');
        };
        
        this.destroy = function() {
            $('.ql-toolbar').remove();
            $('#editor').empty().removeClass();
            
            this.pad_socket.disconnect();
        };
        
        // constructor
        {
            // Inizialize conf if undefined
            if(_.isUndefined(conf))
                conf = {};
            
            // Deactivate editing
            this.deactivateEdit(u.i18n('Loading ...'));
            
            // Connect to socket
            this.pad_socket = socketio.connect(cfg.EVOCRACY_HOST, {secure: true});
            
            this.pad_socket.on('setContents', function(contents) {
                console.log('setContents');
                //console.log(JSON.stringify(contents));
                this.editor.setContents(contents);
                
                // Activate editing
                this.activateEdit();
            
                this.updateDocumentState();
            }.bind(this));
            
            this.pad_socket.on('change', function(change) {
                //console.log(JSON.stringify(change));
                this.editor.updateContents(change);
                
                if(!_.isUndefined(conf.documentState) && conf.documentState == true)
                    this.updateDocumentState();
            }.bind(this));
            
            this.editor = quill;
            this.editor.on('text-change', function(delta, oldDelta, source) {
                if(source != 'user')
                    return;
                
                //console.log('Editor contents have changed', JSON.stringify(delta));
                this.pad_socket.emit('change', delta);
                
                if(!_.isUndefined(conf.documentState) && conf.documentState == true)
                    this.updateDocumentState();
            }.bind(this));
            
            // this packet commands the server to initialize the pad
            this.pad_socket.emit('pad_identity', {'pid': pid});
        }
        
        this.updateDocumentState = function() {
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
            
            // Show if MIN_WORDS_PROPOSAL are reached
            if(words >= cfg.MIN_WORDS_PROPOSAL) {
                $('.propstate button').addClass('btn-success').removeClass('btn-danger')
                    .attr('title', u.i18n('Proposal requirements fulfilled'));
                $('.propstate button span').text(u.i18n('Proposal is valid'));
                $('.propstate i').removeClass('fa-ban');
                $('.propstate i').addClass('fa-check');
            } else {
                $('.propstate button').addClass('btn-danger').removeClass('btn-success').attr('title',
                    u.strformat(u.i18n('proposal requirements not fulfilled, {0} more words required'),
                                    (cfg.MIN_WORDS_PROPOSAL-words)));
                $('.propstate button span').text(u.i18n('Proposal is not valid'));
                $('.propstate i').removeClass('fa-check');
                $('.propstate i').addClass('fa-ban');
            }
        };
    }
    
    return Pad;
});
