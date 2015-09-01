define([
    'Marionette',
    'hbs!templates/layouts/application'
], function(
    Marionette,
    Template
    ) {
    
    var Layout = Marionette.LayoutView.extend({
        template: Template,
        id: 'wrapper',
        
        regions: {
            'view': '#view',
            'sidebar': '#sidebar'
        },
        
        events: {
            'click #logout': function (e) {
                App.eventAggregator.trigger('App:logged_out');
            }
        }
    });
    
    return Layout;
});