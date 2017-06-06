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
            'sidebar': '#sidebar',
            'view': '#view'
        },
        
        events: {
            'click #logout': function (e) {
                App.eventAggregator.trigger('App:logged_out');
            },
            'click .set-language': function(e) {
                e.preventDefault();
                localStorage.setItem('locale', $(e.target).data('locale'));
                // reload the app
                location.reload();
            }
        },
        
        childEvents: {
            show: function() {
                var locale = localStorage.getItem('locale') || 'de';
                var dataLocale = '[data-locale=' + locale + ']';
                $(dataLocale).parent().addClass('active');
            }
        }
    });
    
    return Layout;
});