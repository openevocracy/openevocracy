define([
    'Marionette',
    'hbs!templates/layouts/splash'
], function(
    Marionette,
    Template
    ) {
    
    var Layout = Marionette.LayoutView.extend({
        template: Template,
        tagName: 'section',
        id: 'splash',
        className: 'container',
        
        regions: {
            'form': '#form'
        }
    });
    
    return Layout;
});