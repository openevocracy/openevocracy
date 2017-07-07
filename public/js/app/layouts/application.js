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
                
                // save in local storage
                var lang = $(e.target).data('locale');
                localStorage.setItem('locale', lang);
                // save in database
                var uid = App.session.user.get('_id');
                $.ajax({
                    'url': '/json/user/settings/'+uid,
                    'type' : 'PATCH',
                    'data': {'lang':lang}
                });
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