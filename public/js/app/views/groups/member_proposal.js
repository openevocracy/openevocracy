define([
    'jquery',
    'Marionette',
    'hbs!templates/groups/member_proposal'
], function(
    $,
    Marionette,
    Template
    ) {
    
    var View = Marionette.ItemView.extend({
        template: Template
    });
    
    return View;
});