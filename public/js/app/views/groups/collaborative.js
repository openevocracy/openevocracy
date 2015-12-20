define([
    'jquery',
    'Marionette',
    'etherpad',
    'views/partials/group_events',
    'hbs!templates/groups/collaborative'
], function(
    $,
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
            $('#editor').pad({
                'padId': this.model.get('pid'),
                'height' : 400,
                'noColors' : true,
                'borderStyle' : 'none',
                'showControls' : true
            });
        }
    });
    
    return View;
});