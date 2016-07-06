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
        naviModel: new Model(),
        
        route_navi_index: function() {
            
            // skip if no sidebar is defined
            if(_.isUndefined(App.layout.sidebar))
                return;
                
            this.naviModel.fetch().done(function () {
                var naviView = new NaviView({model: this.naviModel});
                App.layout.sidebar.show(naviView);
            }.bind(this));
        }
    });
    
    return Controller;
});
