define([
    'jquery',
    'Marionette',
    'hbs!templates/blocks/statistics'
], function(
    $,
    Marionette,
    Template
    ) {
    
    var View = Marionette.ItemView.extend({
        template: Template,
        
        initialize: function() {
            this.model.on('change', this.render, this);
        }
    });
    
    return View;
});
