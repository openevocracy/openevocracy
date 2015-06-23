define([
    'Marionette',
    'views/proposal',
    'models/proposal'
], function(
    Marionette,
    TopicView,
    Model
    ) {
    var Controller = Marionette.Controller.extend({
        route_proposal_index: function(id) {
            var proposal = new Model({_id:id});
            var fetching = proposal.fetch();
            fetching.done(function () {
                var view = new TopicView({model:proposal});
                App.layout.content.show(view);
            });
        }
    });
    
    return Controller;
});
