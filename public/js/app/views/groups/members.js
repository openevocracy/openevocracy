define([
    'jquery',
    'application',
    'Marionette',
    'hbs!templates/groups/members'
], function(
    $,
    app,
    Marionette,
    Template
    ) {
    
    var View = Marionette.ItemView.extend({
        template: Template
    });
    
    return View;
});