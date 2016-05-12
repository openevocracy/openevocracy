define([
    'jquery',
    'underscore',
    'Marionette',
    'etherpad',
    'quill',
    'socketio',
    'configs',
    'views/partials/group_events',
    'hbs!templates/groups/collaborative',
], function(
    $,
    _,
    Marionette,
    etherpad,
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
        
        onBeforeRender: function() {
            this.model.set('title', this.viewTitle);
        },
        
        onRender: function() {
        },
        
        onShow: function() {
            setActive('ourprop');
            
            var socket = socketio.connect(conf.EVOCRACY_HOST, {secure: true});
            socket.on('setContents', function(contents) {
                console.log(JSON.stringify(contents));
                if(contents.ops)
                    editor.updateContents(contents);
                else
                    editor.setText(contents);
            });
            
            socket.on('change', function(change) {
                console.log(JSON.stringify(change));
                editor.updateContents(change);
            });
            
            var editor = new Quill('#editor', {
                theme: 'snow'
            });
            
            editor.on('text-change', function(delta, oldDelta, source) {
                if(source != 'user')
                    return;
                
                console.log('Editor contents have changed', JSON.stringify(delta));
                socket.emit('change', delta);
                
                //console.log(readingease);
                console.log(syllable);
            });
        },
        
        onDestroy: function() {
            
        }
    });
    
    return View;
});