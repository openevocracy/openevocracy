define([
    'Marionette',
    'views/register'
], function(
    Marionette,
    RegisterView
    ) {
    var Controller = Marionette.Controller.extend({
        route_register_index: function() {
            var registerView = new RegisterView({model: new Backbone.Model({})});
            App.layout.form.show(registerView);
        }
    });
    
    return Controller;
    });
