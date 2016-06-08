define([
    'Marionette',
    'views/register'
], function(
    Marionette,
    RegisterView
    ) {
    var Controller = Marionette.Controller.extend({
        route_register_index: function() {
            var registerView = new RegisterView();
            App.layout.form.show(registerView);
        }
    });
    
    return Controller;
    });
