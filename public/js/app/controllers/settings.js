define([
    'Marionette',
    'views/settings',
    'models/settings',
], function(
    Marionette,
    SettingsView,
    Settings
    ) {
    var Controller = Marionette.Controller.extend({
        route_settings_index: function() {
            var uid = App.session.user.get('_id');
            var settings = new Settings({'_id':uid});
            
            settings.fetch().done(function () {
                var settingsView = new SettingsView({model:settings});
                App.layout.view.show(settingsView);
            });
        }
    });
    
    return Controller;
});
