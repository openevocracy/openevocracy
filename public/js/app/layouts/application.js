define([
    'Marionette',
    'hbs!templates/layouts/application',
    'layouts/blocks'
], function(
    Marionette,
    Template,
    BlocksLayout
    ) {
    
    var Layout = Marionette.LayoutView.extend({
        template: Template,
        id: 'wrapper',
        
        regions: {
            'view': '#view'
        }
    });
    
    return Layout;
});