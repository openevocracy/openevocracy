define([
    'Marionette',
    'views/user',
    'models/user',
], function(
    Marionette,
    UserView,
    User
    ) {
    var Controller = Marionette.Controller.extend({
        route_user_index: function(uid) {
            var user = new User({'_id':uid});
            
            user.fetch().done(function () {
                var userView = new UserView({model:user});
                App.layout.view.show(userView);
            });
        }
    });
    
    return Controller;
});
