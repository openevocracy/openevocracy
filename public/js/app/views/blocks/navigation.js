define([
    'application',
    'Marionette',
    'hbs!templates/blocks/navigation'
], function(
    app,
    Marionette,
    Template
    ) {
    
    var View = Marionette.ItemView.extend({
        template: Template,
        id: 'navigation',
        
        initialize: function() {
            
        }
    });
    
    return View;
});
