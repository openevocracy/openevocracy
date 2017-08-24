define([
    '../../utils',
    'Marionette',
    'hbs!templates/blocks/navigation'
], function(
    u,
    Marionette,
    Template
    ) {
    
    var View = Marionette.ItemView.extend({
        template: Template,
        id: 'navigation',
        
        modelEvents: {
            'change': 'render'
        },
        
        initialize: function() {
            // create timer for automatic refreshing of list
            this.timer = setInterval(function() {
                this.model.fetch();
            }.bind(this), 10000);
        },
        
        onBeforeRender: function() {
            this.model.updateDerived();
        },
        
        onRender: function() {
            u.updateActive();
        },
        
        onDestroy: function() {
            clearInterval(this.timer);
        }
    });
    
    return View;
});
