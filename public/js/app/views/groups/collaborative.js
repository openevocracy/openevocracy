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
            
            /*$('#editor').pad({
                'padId': this.model.get('pid'),
                'userName' : App.session.user.get('name'),
                'userColor' : App.session.user.get('color'),
                'height' : 400,
                'borderStyle' : 'none',
                'showControls' : true
            });*/
            
            var editor = new Quill('#editor', {
                modules: { toolbar: '#toolbar' },
                theme: 'snow'
            });
            
            var socket = socketio.connect(conf.EVOCRACY_HOST, {secure: true});
            //socket.on('setContents', editor.setContents.bind(editor));
            socket.on('setContents', function(contents) {
                console.log(JSON.stringify(contents));
                editor.setText(contents);
            });
            
            socket.on('change', function(change) {
                console.log(JSON.stringify(change));
                editor.updateContents(change);
            });
            
            editor.on('text-change', function(change, source) {
                if(source != 'user')
                    return;
                
                console.log('Editor contents have changed', JSON.stringify(change));
                socket.emit('change', change);
            });
        }
    });
    
    return View;
});