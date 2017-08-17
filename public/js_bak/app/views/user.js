define([
    'underscore',
    'jquery',
    'Marionette',
    'hbs!templates/user',
    'constants',
    'i18n!nls/lang'
], function(
    _,
    $,
    Marionette,
    Template,
    C,
    lang
    ) {
    
    var View = Marionette.ItemView.extend({
        template: Template,
        tagName: 'section',
        className: "content",
        id: "user-profile",
        
        events: {},
        initialize: function() {}
    });
    
    return View;
});