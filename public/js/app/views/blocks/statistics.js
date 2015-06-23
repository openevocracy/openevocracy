define([
    'jquery',
    'application',
    'Marionette',
    'hbs!templates/blocks/statistics'
], function(
    $,
    app,
    Marionette,
    Template
    ) {
    
    var View = Marionette.ItemView.extend({
        template: Template,
        
        initialize: function() {
            
        }
    });
    
    return View;
});
