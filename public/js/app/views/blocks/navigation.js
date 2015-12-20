define([
    'Marionette',
    'hbs!templates/blocks/navigation'
], function(
    Marionette,
    Template
    ) {
    
    var View = Marionette.ItemView.extend({
        template: Template,
        id: 'navigation',
    });
    
    return View;
});
