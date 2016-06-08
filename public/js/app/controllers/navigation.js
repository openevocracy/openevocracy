define([
    'Marionette',
    'views/blocks/navigation',
    'models/navigation'
], function(
    Marionette,
    NaviView,
    Model
    ) {
    var Controller = Marionette.Controller.extend({
        route_navi_index: function() {
            // skip if no sidebar is defined
            if(_.isUndefined(App.layout.sidebar))
                return;
            
            var naviModel = new Model();
            //naviModel.fetch().done(function () {
                var naviView = new NaviView({model: naviModel});
                App.layout.sidebar.show(naviView);
            //});
        }
    });
    
    return Controller;
});
