define([
    'Marionette',
    'views/login'
], function(
    Marionette,
    LoginView
    ) {
    var Controller = Marionette.Controller.extend({
        route_login_index: function() {
            var loginView = new LoginView({model: new Backbone.Model({})});
            App.layout.form.show(loginView);
        },
        route_verified_index: function() {
            var loginView = new LoginView(
                {model: new Backbone.Model({alert: {
                    'type': 'success',
                    'content': 'You are successfully verified.'}})});
            App.layout.form.show(loginView);
        }
    });
    
    return Controller;
});