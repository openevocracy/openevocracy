define([
    'Marionette',
    'views/notfound'
], function(
    Marionette,
    NotFoundView
    ) {
    var Controller = Marionette.Controller.extend({
        route_notfound_index: function() {
            var notfoundView = new NotFoundView();
            App.layout.view.show(notfoundView);
        }
    });
    
    return Controller;
});
