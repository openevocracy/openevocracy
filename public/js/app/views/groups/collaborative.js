define([
    'jquery',
    'underscore',
    'i18n!nls/lang',
    'Marionette',
    'configs',
    'views/pad',
    'views/partials/group_events',
    'hbs!templates/groups/collaborative'
], function(
    $,
    _,
    i18n,
    Marionette,
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
        viewTitle: i18n['Our proposal'],
        
        events: Events,
        
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
            
            $('[data-toggle="tooltip"]').tooltip();
            
            Pad.onShow.bind(this)();
        },
        
        updateDocumentState: function() {
            Pad.updateDocumentState.bind(this)();
        }
    });
    
    return View;
});