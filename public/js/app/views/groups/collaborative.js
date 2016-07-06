define([
    'jquery',
    'underscore',
    'Marionette',
    'quill',
    'socketio',
    'configs',
    'views/pad',
    'views/partials/group_events',
    'hbs!templates/groups/collaborative'
], function(
    $,
    _,
    Marionette,
    Quill,
    socketio,
    conf,
    Pad,
    Events,
    Template
    ) {
    
    var View = Marionette.ItemView.extend({
        template: Template,
        tagName: 'section',
        className: 'content',
        id: 'collaborative',
        viewTitle: 'Our proposal',
        //pad: new Pad,
        
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
            //setActive('nav-'+this.model.get('_id'));
            
            Pad.onShow.bind(this)();
        },
        
        updateDocumentState: function() {
            Pad.updateDocumentState.bind(this)();
        }
    });
    
    return View;
});