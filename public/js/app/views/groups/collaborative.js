define([
    'jquery',
    'underscore',
    'Marionette',
    'etherpad',
    'views/partials/group_events',
    'hbs!templates/groups/collaborative'
], function(
    $,
    _,
    Marionette,
    etherpad,
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
        
        onBeforeRender: function() {
            this.model.set('title', this.viewTitle);
        },
        
        onShow: function() {
            setActive('ourprop');
            
            $('#editor').pad({
                'padId': this.model.get('pid'),
                'userName' : App.session.user.get('name'),
                'userColor' : App.session.user.get('color'),
                'height' : 400,
                'borderStyle' : 'none',
                'showControls' : true
            });
        }
    });
    
    return View;
});