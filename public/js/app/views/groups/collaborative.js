define([
    'jquery',
    'underscore',
    'Marionette',
    'quill',
    'socketio',
    'configs',
    'views/partials/group_events',
    'hbs!templates/groups/collaborative',
], function(
    $,
    _,
    Marionette,
    Quill,
    socketio,
    conf,
    Events,
    Template
    ) {
    
    var View = Marionette.ItemView.extend({
        template: Template,
        tagName: 'section',
        className: 'content',
        id: 'collaborative',
        viewTitle: 'Our proposal',
        
        events: Events,
        //socket: socketio.connect(conf.EVOCRACY_HOST, {secure: true}),
        
        initialize: function() {
            //this.model.set('subtitle', '#');
        },
        
        onBeforeRender: function() {
            this.model.set('title', this.viewTitle);
        },
        
        onRender: function() {
        },
        
        onShow: function() {
            setActive('ourprop');
            
            var socket = socketio.connect(conf.EVOCRACY_HOST, {secure: true});
            var editor = new Quill('#editor', {theme: 'snow'});
            
            socket.on('setContents', function(contents) {
                console.log(JSON.stringify(contents));
                if(contents.ops)
                    editor.updateContents(contents);
                else
                    editor.setText(contents);
                this.updateDocumentState();
            }.bind(this));
            socket.on('change', function(change) {
                console.log(JSON.stringify(change));
                editor.updateContents(change);
            });
            
            editor.on('text-change', function(delta, oldDelta, source) {
                if(source != 'user')
                    return;
                
                console.log('Editor contents have changed', JSON.stringify(delta));
                socket.emit('change', delta);
                
                this.updateDocumentState();
            }.bind(this));
            
            socket.emit('identity', {'pid': this.model.get('pid')});
        },
        
        onDestroy: function() {
            
        },
        
        updateDocumentState: function() {
            // count words
            var words = $('#editor').text().split(/\s+\b/).length;
            
            // calculate state
            var limits = {
                "simple": 0,
                "standard": 99,
                "advanced": 249,
                "excellent": 449,
                "superior": 699
            };
            
            var position = _.sortedIndex(_.values(limits), words);
            var state_curr = _.pairs(limits)[position-1];
            var state_next = _.pairs(limits)[position];
            
            // set states
            /*if(position != 5)
                $('.subtitle').text('Your document reached ' + state_curr[0] + ' status, write ' + (state_next[1]-words) + ' more words, to reach ' + state_next[0] + ' status');
            else
                $('.subtitle').text('Congratulations, you wrote a ' + state_curr[0] + ' document.');
            */
            
            $('.state-status').html('You reached ' + state_curr[0] + ' status'
                + '<br/><small>Write '+ (state_next[1]-words+1) + ' more words for ' + state_next[0] + ' status</small>');
            
            var stars = '';
            for(var i = 1; i <= 5; i++) {
                if(i <= position)
                    stars += '<i class="fa fa-star" aria-hidden="true"></i>';
                else
                    stars += '<i class="fa fa-star-o" aria-hidden="true"></i>';
            }
            $('.state-stars').html(stars);
        }
    });
    
    return View;
});