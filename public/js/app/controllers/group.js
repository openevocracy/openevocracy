define([
    'underscore',
    'Marionette',
    'views/groups/collaborative',
    'models/group'
], function(
    _,
    Marionette,
    CollabView,
    Model
    ) {
    var Controller = Marionette.Controller.extend({
        route_group_index: function(id) {
            var group = new Model({'_id': id});
            group.fetch().done(function () {
                var collabView = new CollabView({model:group});
                App.layout.view.show(collabView);
            });
        }
    });
    
    return Controller;
});
