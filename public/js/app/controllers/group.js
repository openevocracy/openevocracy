define([
    'Marionette',
    'views/groups/details'
], function(
    Marionette,
    GroupView
    ) {
    var Controller = Marionette.Controller.extend({
        route_group_index: function(id) {
            var view = new GroupView({id:id});
            App.layout.view.show(view);
        }
    });
    
    return Controller;
});
