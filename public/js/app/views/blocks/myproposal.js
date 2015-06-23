define([
    'jquery',
    'application',
    'Marionette',
    'hbs!templates/blocks/myproposal'
], function(
    $,
    app,
    Marionette,
    Template
    ) {
    
    var View = Marionette.ItemView.extend({
        template: Template,
        
        initialize: function() {
            // wie kommt man jetzt ans model?
        }
    });
    
    return View;
});
