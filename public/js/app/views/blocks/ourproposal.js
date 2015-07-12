define([
    'application',
    'Marionette',
    'hbs!templates/blocks/ourproposal'
], function(
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
