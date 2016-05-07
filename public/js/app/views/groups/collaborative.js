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
            
            editor.on('text-change', function(delta, source) {
                console.log('Editor contents have changed', delta);
                socket.emit('delta', delta);
            });
            
            /*socket.on('news', function (data) {
                console.log(data);
                socket.emit('my other event', { my: 'data' });
            });*/
        }
    });
    
    return View;
});