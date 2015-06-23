define([
    'Marionette'
], function(
    Marionette
    ) {
    //Template application.html wird beschrieben
    var Layout = Marionette.LayoutView.extend({
        template: '#blocks-template',
        id: 'blocklist'
    });
    
    return Layout;
});