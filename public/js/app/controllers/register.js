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
            
            /* TODO delete: does not exist on splashscreen */
            /* ### LEFT ### */
            /*var naviView = new NaviView();
            App.layout.sidebar.show(naviView);*/
            
            /* ### CONTENT RIGHT ### */
            /*var centerRightLayout = new CenterRightLayout();
            App.layout.view.show(centerRightLayout);
            
            var registerView = new RegisterView();
            centerRightLayout.center.show(registerView);*/
        }
    });
    
    return Controller;
    });
