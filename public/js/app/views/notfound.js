define([
    'Marionette',
    'hbs!templates/notfound',
    'jquery',
    '../utils'
    ], function(
    Marionette,
    Template,
    $,
    u
    ) {

    var View = Marionette.CompositeView.extend({
        template: Template,
        tagName: 'section',
        id: 'notfound',
        
        events: {}
    });
    
    return View;
});