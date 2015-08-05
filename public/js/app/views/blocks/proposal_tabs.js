define([
    'application',
    'Marionette',
    'hbs!templates/blocks/proposal_tabs'
], function(
    app,
    Marionette,
    Template
    ) {
    
    var View = Marionette.ItemView.extend({
        template: Template
    });
    
    return View;
});
