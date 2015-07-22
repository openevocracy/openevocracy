define([
    'Marionette',
    'layouts/center_right',
    'views/blocks/navigation',
    'views/register'
], function(
    Marionette,
    CenterRightLayout,
    NaviView,
    RegisterView
    ) {
    var Controller = Marionette.Controller.extend({
        route_register_index: function() {
            /* ### LEFT ### */
            var naviView = new NaviView();
            App.layout.sidebar.show(naviView);
            
            /* ### CONTENT RIGHT ### */
            var centerRightLayout = new CenterRightLayout();
            App.layout.view.show(centerRightLayout);
            
            var registerView = new RegisterView();
            centerRightLayout.center.show(registerView);
        }
    });
    
    return Controller;
    });
