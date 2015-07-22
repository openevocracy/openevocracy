define([
    'Marionette',
    'layouts/center_right',
    'views/blocks/navigation',
    'views/login'
], function(
    Marionette,
    CenterRightLayout,
    NaviView,
    LoginView
    ) {
    var Controller = Marionette.Controller.extend({
        route_login_index: function() {
            /* ### LEFT ### */
            var naviView = new NaviView();
            App.layout.sidebar.show(naviView);
            
            /* ### CONTENT RIGHT ### */
            var centerRightLayout = new CenterRightLayout();
            App.layout.view.show(centerRightLayout);
            
            var loginView = new LoginView();
            centerRightLayout.center.show(loginView);
        }
    });
    
    return Controller;
    });
