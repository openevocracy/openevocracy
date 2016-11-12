define([
    'jquery',
    'underscore',
    'Marionette',
    'configs',
    'views/pad',
    'views/partials/group_events',
    'hbs!templates/groups/collaborative',
    '../utils'
], function(
    $,
    _,
    Marionette,
    conf,
    Pad,
    Events,
    Template,
    u
    ) {
    
    var View = Marionette.ItemView.extend({
        template: Template,
        tagName: 'section',
        className: 'content',
        id: 'collaborative',
        viewTitle: u.i18n('Our proposal'),
        
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
            u.setActive('ourprop');
            //u.setActive('nav-'+this.model.get('_id'));
            
            $('[data-toggle="tooltip"]').tooltip();
            
            Pad.onShow.bind(this)();
        },
        
        updateDocumentState: function() {
            Pad.updateDocumentState.bind(this)();
        }
    });
    
    return View;
});